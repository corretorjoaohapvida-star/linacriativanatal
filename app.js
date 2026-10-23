(() => {
 const config=window.OFERTA_CONFIG||{};
 document.querySelectorAll('[data-checkout]').forEach(link=>{const url=(config.checkouts?.[link.dataset.checkout]||'').trim();if(/^https?:\/\//i.test(url)){link.href=url;link.removeAttribute('aria-disabled');link.rel='noopener noreferrer';}else{link.setAttribute('aria-disabled','true');link.addEventListener('click',e=>e.preventDefault());}});
 const cards=[...document.querySelectorAll('.faq details')];cards.forEach(item=>item.addEventListener('toggle',()=>{if(item.open)cards.forEach(other=>{if(other!==item)other.open=false})}));
 const strip=document.querySelector('.carousel');let last;let paused=false;const reduce=matchMedia('(prefers-reduced-motion: reduce)');if(strip){strip.addEventListener('pointerenter',()=>paused=true);strip.addEventListener('pointerleave',()=>paused=false);strip.addEventListener('touchstart',()=>paused=true,{passive:true});strip.addEventListener('focusin',()=>paused=true);strip.addEventListener('focusout',()=>paused=false);function tick(t){const dt=last===undefined?0:Math.min(t-last,50);last=t;if(!paused&&!reduce.matches&&!document.hidden){strip.scrollLeft+=dt*.028;if(strip.scrollLeft>=strip.scrollWidth-strip.clientWidth-1)strip.scrollLeft=0}requestAnimationFrame(tick)}requestAnimationFrame(tick)}
})();
// Contador de 24 horas do banner, persistido entre visitas.
(() => {
  const timer = document.querySelector('.launch-countdown');
  if (!timer) return;
  const duration = 24 * 60 * 60 * 1000;
  const key = 'lina-natal-countdown-v1';
  const fields = ['hours', 'minutes', 'seconds'].map(unit => timer.querySelector('[data-launch-' + unit + ']'));
  if (fields.some(field => !field)) return;
  let deadline;
  try { deadline = Number(localStorage.getItem(key)); } catch (_) {}
  const now = Date.now();
  if (!Number.isFinite(deadline) || deadline <= 0 || deadline > now + duration) deadline = now + duration;
  function persist() {
    try { localStorage.setItem(key, String(deadline)); } catch (_) {}
  }
  function render() {
    const current = Date.now();
    if (current >= deadline) {
      deadline += (Math.floor((current - deadline) / duration) + 1) * duration;
      persist();
    }
    const total = Math.max(0, Math.ceil((deadline - current) / 1000));
    const parts = [Math.floor(total / 3600), Math.floor(total / 60) % 60, total % 60];
    fields.forEach((field, index) => {
      const next = String(parts[index]).padStart(2, '0');
      if (field.textContent === next) return;
      field.textContent = next;
      if (!timer.hidden && field.animate && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
        field.animate([{ opacity: .4, transform: 'translateY(3px)' }, { opacity: 1, transform: 'translateY(0)' }], { duration: 240, easing: 'ease-out' });
      }
    });
    timer.setAttribute('aria-label', parts[0] + ' horas, ' + parts[1] + ' minutos e ' + parts[2] + ' segundos');
    timer.hidden = false;
  }
  persist();
  render();
  setInterval(render, 1000);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) render(); });
  window.addEventListener('storage', event => {
    if (event.key !== key) return;
    const value = Number(event.newValue);
    if (Number.isFinite(value) && value > 0 && value <= Date.now() + duration) { deadline = value; render(); }
  });
})();

// Ampliação das fotos: diálogo nativo, teclado, Escape e retorno de foco.
(() => {
  const images = [...document.querySelectorAll('.hero-photo>img,.product-card>img,.product-photo>img,.carousel img,img.plan-image')];
  if (!images.length) return;
  const dialog = document.createElement('dialog');
  dialog.className = 'photo-dialog';
  dialog.setAttribute('aria-labelledby', 'photo-dialog-title');
  dialog.innerHTML = '<button type="button" class="photo-dialog-close" aria-label="Fechar imagem" autofocus>×</button><figure><img class="photo-dialog-image" alt=""><figcaption id="photo-dialog-title"></figcaption></figure>';
  document.body.append(dialog);
  const preview = dialog.querySelector('img');
  preview.src = images[0].currentSrc || images[0].src;
  const caption = dialog.querySelector('figcaption');
  let lastTrigger, oldOverflow = '';
  function close() { dialog.close(); }
  dialog.querySelector('button').addEventListener('click', close);
  dialog.addEventListener('click', event => { if (event.target === dialog) close(); });
  dialog.addEventListener('close', () => {
    document.body.style.overflow = oldOverflow;
    lastTrigger?.focus({preventScroll: true});
  });
  images.forEach(image => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'image-zoom';
    button.setAttribute('aria-label', 'Ampliar imagem: ' + image.alt);
    button.setAttribute('aria-haspopup', 'dialog');
    image.before(button);button.append(image);
    const badge = document.createElement('span');
    badge.className = 'image-zoom-badge';
    badge.setAttribute('aria-hidden', 'true');
    badge.innerHTML = '<svg viewBox="0 0 24 24" fill="none"><circle cx="10" cy="10" r="6" stroke="currentColor" stroke-width="1.7"/><path d="m15 15 5 5M7 10h6m-3-3v6" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>';
    button.append(badge);
    let startX = 0, startY = 0, moved = false;
    button.addEventListener('pointerdown', event => { startX = event.clientX; startY = event.clientY; moved = false; });
    button.addEventListener('pointermove', event => { if (Math.abs(event.clientX-startX)>8 || Math.abs(event.clientY-startY)>8) moved = true; });
    button.addEventListener('click', event => {
      if (moved && event.detail !== 0) { moved = false; return; }
      lastTrigger = button;
      preview.src = image.currentSrc || image.src;
      preview.alt = image.alt;
      preview.classList.toggle('photo-vivid', image.classList.contains('photo-vivid'));
      caption.textContent = button.closest('.product-card')?.querySelector('h3')?.textContent
        || button.closest('figure')?.querySelector('figcaption')?.textContent
        || image.alt;
      oldOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      dialog.showModal();
    });
  });
})();

