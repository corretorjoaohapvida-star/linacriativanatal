(() => {
  'use strict';
  const root=document.querySelector('.craft-journey');if(!root)return;
  const tabs=[...root.querySelectorAll('[data-craft-step]')],panels=[...root.querySelectorAll('.craft-panel')],next=root.querySelector('[data-craft-next]'),back=root.querySelector('[data-craft-back]'),offer=root.querySelector('[data-craft-offer]'),input=root.querySelector('#craft-name');
  const choices=[...root.querySelectorAll('[data-craft-select]')],canvases=[...root.querySelectorAll('[data-craft-canvas]')];
  const images=choices.map(button=>{const image=new Image();image.src=button.querySelector('img').getAttribute('src');image.onload=draw;return image;});
  const labels=['Escolher essa arte →','Ver minha arte →','Agora, vamos montar →','Ver meu mimo pronto →'];
  const notes=['Sua ideia começa pela capa.','Um nome pode deixar esse mimo ainda mais especial.','Você imprime com seus materiais, no tamanho indicado no arquivo.','O recorte e a montagem são feitos por você.','A Mini Bíblia está nos dois planos. Escolha o seu para começar.'];
  let step=0,selected=0,printingTimer,assemblyTimer,drawFrame;
  function name(){return input.value.trim().replace(/\s+/g,' ').slice(0,24);}
  function draw(){
    const image=images[selected];if(!image?.complete||!image.naturalWidth)return;
    const text=name();
    for(const canvas of canvases){const ctx=canvas.getContext('2d');ctx.clearRect(0,0,canvas.width,canvas.height);ctx.drawImage(image,0,0,canvas.width,canvas.height);canvas.setAttribute('aria-label','Prévia da Mini Bíblia'+(text?' com o nome '+text:''));if(!text)continue;
      let size=canvas.width*.065;ctx.font='700 '+size+'px "Playfair Display"';while(ctx.measureText(text).width>canvas.width*.54&&size>7){size-=.5;ctx.font='700 '+size+'px "Playfair Display"';}
      const metrics=ctx.measureText(text),asc=metrics.actualBoundingBoxAscent||size*.75,desc=metrics.actualBoundingBoxDescent||size*.25,x=canvas.width/2,y=canvas.height*(selected===0?.72:.78),baseline=y+(asc-desc)/2,pad=5;
      ctx.fillStyle='#fff8ed';ctx.fillRect(x-metrics.width/2-pad,baseline-asc-pad,metrics.width+pad*2,asc+desc+pad*2);ctx.textAlign='center';ctx.fillStyle='#8f2033';ctx.fillText(text,x,baseline);
    }
    root.querySelector('[data-craft-name-note]').textContent=text?'Olha como ficou com '+text+'.':'Você também pode seguir sem acrescentar nome.';
    root.querySelector('[data-craft-result-name]').textContent=text?'Uma Mini Bíblia para '+text+'.':'Seu próximo mimo pode começar assim.';
    root.querySelector('[data-craft-keepsake]').textContent=text?'Uma mensagem de fé, com um nome especial.':'Um pequeno mimo. Uma mensagem para guardar.';
  }
  function show(index,focus=false){
    clearTimeout(printingTimer);clearTimeout(assemblyTimer);step=Math.max(0,Math.min(panels.length-1,index));
    panels.forEach((panel,i)=>{panel.hidden=i!==step;panel.classList.remove('is-running','is-printed','is-assembling');tabs[i].setAttribute('aria-selected',String(i===step));tabs[i].classList.toggle('is-done',i<step);tabs[i].tabIndex=i===step?0:-1;});
    root.querySelector('.craft-meter span').style.width=((step+1)/panels.length*100)+'%';back.hidden=step===0;next.hidden=step===4;offer.hidden=step!==4;next.disabled=false;next.textContent=labels[step]||'';root.querySelector('[data-craft-position]').textContent=notes[step];
    if(step===2){const panel=panels[2],status=root.querySelector('[data-craft-print-status]');status.textContent='Sua arte está saindo na prévia…';next.disabled=true;next.textContent='Preparando a folha…';void panel.offsetWidth;panel.classList.add('is-running');printingTimer=setTimeout(()=>{panel.classList.remove('is-running');panel.classList.add('is-printed');status.textContent='Folha pronta na prévia. Agora vem a montagem.';next.disabled=false;next.textContent=labels[2];},matchMedia('(prefers-reduced-motion: reduce)').matches?80:2500);}
    if(step===3){void panels[3].offsetWidth;panels[3].classList.add('is-assembling');assemblyTimer=setTimeout(()=>panels[3].classList.remove('is-assembling'),1750);}
    draw();if(focus)tabs[step].focus({preventScroll:true});
  }
  choices.forEach((button,i)=>button.addEventListener('click',()=>{selected=i;choices.forEach((item,j)=>item.setAttribute('aria-pressed',String(j===i)));draw();}));
  input.addEventListener('input',()=>{cancelAnimationFrame(drawFrame);drawFrame=requestAnimationFrame(draw);});
  next.addEventListener('click',()=>show(step+1));back.addEventListener('click',()=>show(step-1));
  tabs.forEach((tab,i)=>{tab.addEventListener('click',()=>show(i));tab.addEventListener('keydown',e=>{if(!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;e.preventDefault();show(e.key==='Home'?0:e.key==='End'?panels.length-1:step+(e.key==='ArrowLeft'?-1:1),true);});});
  document.fonts.ready.then(draw);show(0);
})();
