/* ============ SAFE MARQUEE ============ */
(() => {
    const marquee = document.getElementById('marquee');
    if (!marquee) return;
    marquee.addEventListener('mouseenter', () => marquee.style.animationPlayState = 'paused');
    marquee.addEventListener('mouseleave', () => marquee.style.animationPlayState = 'running');
    window.setMarqueeSpeed = s => marquee.style.animationDuration = s + 's';
  })();

/* ============ TESTIMONIALS (contenido sube dentro de la misma card fija) ============ */
document.addEventListener('DOMContentLoaded', () => {
    const wrap = document.getElementById('tstCarousel');
    if (!wrap) return;
  
    const viewport = wrap.querySelector('.tst-viewport');
    const slides   = Array.from(viewport.querySelectorAll('.tst-card')); // las 3 cards originales
    const prevBtn  = wrap.querySelector('.tst-prev');
    const nextBtn  = wrap.querySelector('.tst-next');
  
    // guardamos el contenido de cada slide y construimos un "shell" único (card fija)
    const contents = slides.map(s => s.innerHTML);
    let index = slides.findIndex(s => s.classList.contains('is-active'));
    if (index < 0) index = 0;
  
    // limpiar y crear tarjeta fija
    viewport.innerHTML = '';
    const shell = document.createElement('article');
    shell.className = 'tst-card is-active'; // misma apariencia
    // escenario que recorta y aloja el strip
    const stage = document.createElement('div');
    stage.style.overflow = 'hidden';
    stage.style.position = 'relative';
    // tira vertical que se mueve
    const strip = document.createElement('div');
    strip.style.display = 'grid';
    strip.style.gridAutoRows = 'min-content';
    strip.style.willChange = 'transform';
  
    // dos paneles (actual y próximo)
    const paneA = document.createElement('div');
    const paneB = document.createElement('div');
  
    paneA.innerHTML = contents[index];
    paneB.innerHTML = ''; // se llena al avanzar
  
    strip.appendChild(paneA);
    strip.appendChild(paneB);
    stage.appendChild(strip);
    shell.appendChild(stage);
    viewport.appendChild(shell);
  
    // helpers
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const DURATION = reduced ? 0 : 380;
    const EASE = 'cubic-bezier(.22,.61,.36,1)';
    const AUTOPLAY_MS = 5000;
  
    let timer = null;
    let animating = false;
  
    function h(el){
      // fuerza layout para medir alto real
      el.style.position = 'relative';
      el.style.visibility = 'hidden';
      el.style.transform = 'none';
      el.style.opacity = '1';
      const r = el.getBoundingClientRect().height;
      el.style.visibility = '';
      return r;
    }
  
    function setStageHeight(px){
      stage.style.height = px + 'px';
    }
  
    function prepareHeights(nextHTML){
      // setea panes con actual y próximo, devuelve altos
      paneA.innerHTML = contents[index];
      paneB.innerHTML = nextHTML;
      // reset transform para medir
      strip.style.transition = 'none';
      strip.style.transform = 'translateY(0)';
      // medir altos de cada pane
      const a = h(paneA);
      const b = h(paneB);
      // aseguramos que la stage no salte durante la transición
      setStageHeight(Math.max(a, b));
      // deja strip listo para animar desde 0 a -100%
      return { a, b };
    }
  
    function goTo(newIdx){
      if (animating) return;
      const safeIdx = (newIdx + contents.length) % contents.length;
      if (safeIdx === index) return;
      animating = true;
  
      const nextHTML = contents[safeIdx];
      const { a, b } = prepareHeights(nextHTML);
  
      // animar: contenido sube dentro del marco
      // (si reduce motion, saltamos sin transición)
      requestAnimationFrame(() => {
        if (DURATION === 0) {
          strip.style.transform = 'translateY(-100%)';
          finish();
        } else {
          // activar transición
          strip.style.transition = `transform ${DURATION}ms ${EASE}`;
          // mover
          strip.style.transform = 'translateY(-100%)';
          const end = () => { strip.removeEventListener('transitionend', end); finish(); };
          strip.addEventListener('transitionend', end);
          // fallback por si no dispara
          setTimeout(finish, DURATION + 50);
        }
      });
  
      function finish(){
        // quedarnos con el contenido final en paneA y limpiar paneB
        index = safeIdx;
        paneA.innerHTML = contents[index];
        paneB.innerHTML = '';
        // volver strip a 0 sin parpadeo
        strip.style.transition = 'none';
        strip.style.transform = 'translateY(0)';
        // ajustar altura final al nuevo contenido
        setStageHeight(h(paneA));
        animating = false;
      }
    }
  
    function next(n = 1){ goTo(index + n); }
    function play(){ stop(); if (!reduced) timer = setInterval(() => next(1), AUTOPLAY_MS); }
    function stop(){ if (timer) { clearInterval(timer); timer = null; } }
  
    // init
    setStageHeight(h(paneA));
    play();
  
    // UI
    prevBtn?.addEventListener('click', () => { next(-1); play(); });
    nextBtn?.addEventListener('click', () => { next( 1); play(); });
  
    wrap.addEventListener('mouseenter', stop);
    wrap.addEventListener('mouseleave', play);
    wrap.addEventListener('focusin',  stop);
    wrap.addEventListener('focusout', play);
  
    wrap.addEventListener('keydown', e => {
      if (e.key === 'ArrowLeft')  { next(-1); play(); }
      if (e.key === 'ArrowRight') { next( 1); play(); }
    });
  
    addEventListener('resize', () => setStageHeight(h(paneA)), { passive:true });
  });

// UX simple de envío a Formspark (sin reCAPTCHA)
(function () {
  const form = document.getElementById('contactForm');
  if (!form) return;

  const note = document.getElementById('formNote');
  const btn  = document.getElementById('submitBtn');

  function setNote(msg, ok){
    if (!note) return;
    note.textContent = msg || '';
    if (ok == null) return;
    note.style.color = ok ? '#198754' : '#c23b22';
  }

  form.addEventListener('submit', async function (e) {
    e.preventDefault();
    setNote('');

    // honeypot
    if (form._gotcha && form._gotcha.value.trim() !== '') return;

    btn.disabled = true;
    const original = btn.textContent;
    btn.textContent = 'Sending...';

    try {
      const res = await fetch(form.action, {
        method: 'POST',
        body: new FormData(form),
        headers: { Accept: 'application/json' }
      });

      let data = {};
      try { data = await res.json(); } catch(_) {}

      console.log('Formspark response:', res.status, data);

      if (!res.ok || data.success === false) {
        throw new Error(data.message || 'Request failed');
      }

      setNote('Thanks. We will contact you shortly.', true);
      form.reset();
    } catch (err) {
      console.error(err);
      setNote('Could not send your message. Please try again.', false);
    } finally {
      btn.disabled = false;
      btn.textContent = original;
    }
  });
})();