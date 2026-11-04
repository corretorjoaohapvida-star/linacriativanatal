import { createHash, timingSafeEqual, randomUUID } from "node:crypto";

const pixel = "DBLBLQJC77UDLIGRANU0";

function equal(a, b) {
  const x = Buffer.from(String(a || ""));
  const y = Buffer.from(String(b || ""));
  return x.length === y.length && timingSafeEqual(x, y);
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });

  const auth = process.env.WIAPY_WEBHOOK_TOKEN;
  const apiToken = process.env.TIKTOK_EVENTS_API_TOKEN;
  if (!auth || !apiToken) return res.status(503).json({ error: "Not configured" });
  if (!equal(req.headers.authorization, auth)) return res.status(401).json({ error: "Unauthorized" });

  const body = req.body;
  const payment = body?.payment;
  if (payment?.status !== "paid") return res.status(200).json({ ignored: true });
  if (!payment.id || !Number.isSafeInteger(payment.amount) || payment.amount <= 0) {
    return res.status(400).json({ error: "Invalid payment" });
  }

  const user = {};
  const email = body?.customer?.email;
  if (typeof email === "string" && email.trim()) {
    user.email = createHash("sha256").update(email.trim().toLowerCase()).digest("hex");
  }
  if (body?.tracking?.ip) user.ip = body.tracking.ip;
  if (body?.tracking?.useragent) user.user_agent = body.tracking.useragent;

  const tracking = body?.tracking || {};

  // Preserve Wiapy's stable product/checkout IDs for TikTok catalog matching.
  // Never use the transaction ID as a product ID: it changes on every sale.
  const contents = [];
  for (const product of Array.isArray(body?.products) ? body.products : []) {
    if (typeof product?.id !== "string" || !product.id.trim()) continue;
    const item = { content_id: product.id.trim(), quantity: 1 };
    if (typeof product.title === "string" && product.title.trim()) {
      item.content_name = product.title.trim();
    }
    contents.push(item);
  }

  if (contents.length === 0 && typeof body?.checkout?.id === "string" && body.checkout.id.trim()) {
    const item = { content_id: body.checkout.id.trim(), quantity: 1 };
    if (typeof body.checkout.title === "string" && body.checkout.title.trim()) {
      item.content_name = body.checkout.title.trim();
    }
    contents.push(item);
  }

  for (const bump of Array.isArray(body?.checkout?.orderbump) ? body.checkout.orderbump : []) {
    if (typeof bump?.id !== "string" || !bump.id.trim()) continue;
    if (contents.some(item => item.content_id === bump.id.trim())) continue;
    const item = { content_id: bump.id.trim(), quantity: 1 };
    if (typeof bump.title === "string" && bump.title.trim()) item.content_name = bump.title.trim();
    if (Number.isSafeInteger(bump.amount) && bump.amount >= 0) item.price = bump.amount / 100;
    contents.push(item);
  }
  if (contents.length === 1 && Number.isSafeInteger(body?.checkout?.amount) && body.checkout.amount >= 0) {
    contents[0].price = body.checkout.amount / 100;
  }

  const event = {
    event: "Purchase",
    event_time: Math.floor(Date.now() / 1000),
    event_id: "wiapy_" + String(payment.id),
    user,
    page: { url: "https://linacriativanatal.vercel.app/" },
    properties: {
      currency: "BRL",
      value: payment.amount / 100,
      content_type: "product",
      ...(contents.length > 0 ? { content_ids: contents.map(item => item.content_id), contents } : {}),
      description: body?.checkout?.title || "Pack de Natal"
    }
  };
  const payload = { event_source: "web", event_source_id: pixel, data: [event] };

  // Wiapy marks synthetic test webhooks with x-wiapy-test: true.
  // The auth token has already been verified above. Normal paid orders
  // will never use TikTok test mode.
  const isWiapyTest = String(req.headers["x-wiapy-test"] || "").toLowerCase() === "true";
  const testCode = process.env.TIKTOK_TEST_EVENT_CODE;
  if (isWiapyTest) {
    if (!testCode) return res.status(503).json({ error: "TikTok test code not configured" });
    // Wiapy reuses a fixed synthetic transaction ID. Give each synthetic test
    // a fresh event ID so TikTok does not discard repeat tests as duplicates.
    event.event_id = "wiapy_test_" + randomUUID();
    payload.test_event_code = testCode;
  }
  for (const k of ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"]) {
    if (typeof tracking[k] === "string") payload[k] = tracking[k];
  }

  try {
    const response = await fetch("https://business-api.tiktok.com/open_api/v1.3/event/track/", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Access-Token": apiToken },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(9000)
    });
    const data = await response.json();
    if (!response.ok || data.code !== 0) {
      console.error("TikTok response code", response.status, data.code);
      return res.status(502).json({ error: "Delivery failed" });
    }
    if (isWiapyTest) {
      console.info("Wiapy synthetic TikTok test accepted", {
        httpStatus: response.status,
        code: data.code,
        requestId: data.request_id || null,
        eventId: event.event_id,
        testCodeIncluded: Boolean(payload.test_event_code)
      });
      return res.status(200).json({ received: true, synthetic_test: true, tiktok_code: data.code, tiktok_request_id: data.request_id || null });
    }
    return res.status(200).json({ received: true });
  } catch (err) {
    console.error("TikTok connection failed", err?.message);
    return res.status(502).json({ error: "Delivery failed" });
  }
}
