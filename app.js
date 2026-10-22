(() => {
 const config=window.OFERTA_CONFIG||{};
 document.querySelectorAll('[data-checkout]').forEach(link=>{const url=(config.checkouts?.[link.dataset.checkout]||'').trim();if(/^https?:\/\//i.test(url)){link.href=url;link.removeAttribute('aria-disabled');link.rel='noopener noreferrer';}else{link.setAttribute('aria-disabled','true');link.addEventListener('click',e=>e.preventDefault());}});
 const cards=[...document.querySelectorAll('.faq details')];cards.forEach(item=>item.addEventListener('toggle',()=>{if(item.open)cards.forEach(other=>{if(other!==item)other.open=false})}));
 const strip=document.querySelector('.carousel');let last;let paused=false;const reduce=matchMedia('(prefers-reduced-motion: reduce)');if(strip){strip.addEventListener('pointerenter',()=>paused=true);strip.addEventListener('pointerleave',()=>paused=false);strip.addEventListener('touchstart',()=>paused=true,{passive:true});strip.addEventListener('focusin',()=>paused=true);strip.addEventListener('focusout',()=>paused=false);function tick(t){const dt=last===undefined?0:Math.min(t-last,50);last=t;if(!paused&&!reduce.matches&&!document.hidden){strip.scrollLeft+=dt*.028;if(strip.scrollLeft>=strip.scrollWidth-strip.clientWidth-1)strip.scrollLeft=0}requestAnimationFrame(tick)}requestAnimationFrame(tick)}
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

