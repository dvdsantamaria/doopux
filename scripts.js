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

  
  // Minimal AJAX submit to Formspark with centered toast. No redirect.
document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('contactForm');
  if (!form) return;

  // Use a fixed endpoint so the form action cannot trigger navigation
  const FORMSPARK_URL = 'https://submit-form.com/Po4c9Fm5U';

  // Optional: nuke any _redirect field if exists
  form.querySelector('input[name="_redirect"]')?.remove();

  // Prevent default and any other handlers from submitting the page
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    e.stopImmediatePropagation();

    const submitBtn = form.querySelector('[type="submit"]');
    const hp = form.querySelector('input[name="_gotcha"]');
    if (hp && hp.value) return; // bot trap

    try {
      submitBtn?.setAttribute('disabled', 'true');
      const fd = new FormData(form);

      const res = await fetch(FORMSPARK_URL, {
        method: 'POST',
        headers: { 'Accept': 'application/json' }, // avoids Formspark redirect
        body: fd
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        showToast(data.message || 'Submission failed. Please try again.', true, 5500);
        return;
      }

      form.reset();
      showToast('Your message was sent successfully.', false, 3500);
    } catch (err) {
      showToast('Network error. Please try again.', true, 5500);
    } finally {
      submitBtn?.removeAttribute('disabled');
    }
  }, { capture: true }); // capture helps beat other listeners

  // Toast tiny helper
  const toastEl = document.getElementById('toast') || (() => {
    const t = document.createElement('div');
    t.id = 'toast';
    t.setAttribute('role','status');
    t.setAttribute('aria-live','polite');
    t.setAttribute('aria-atomic','true');
    document.body.appendChild(t);
    return t;
  })();

  window.showToast = function(message, isError = false, timeoutMs = 4000){
    toastEl.innerHTML = `<div class="card${isError ? ' error' : ''}">${message}</div>`;
    toastEl.classList.add('show');
    clearTimeout(window.showToast._t);
    window.showToast._t = setTimeout(() => toastEl.classList.remove('show'), timeoutMs);
  };
});

  // Toast tiny helper
