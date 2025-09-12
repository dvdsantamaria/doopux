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
  if (!viewport) return;

  const slides = Array.from(viewport.querySelectorAll('.tst-card'));
  if (slides.length === 0) return;

  const prevBtn = wrap.querySelector('.tst-prev');
  const nextBtn = wrap.querySelector('.tst-next');

  const contents = slides.map(s => s.innerHTML);
  let index = slides.findIndex(s => s.classList.contains('is-active'));
  if (index < 0) index = 0;

  // limpiar y crear tarjeta fija
  viewport.innerHTML = '';
  const shell = document.createElement('article');
  shell.className = 'tst-card is-active';

  const stage = document.createElement('div');
  stage.style.overflow = 'hidden';
  stage.style.position = 'relative';

  const strip = document.createElement('div');
  strip.style.display = 'grid';
  strip.style.gridAutoRows = 'min-content';
  strip.style.willChange = 'transform';

  const paneA = document.createElement('div');
  const paneB = document.createElement('div');

  paneA.innerHTML = contents[index];
  paneB.innerHTML = '';

  strip.appendChild(paneA);
  strip.appendChild(paneB);
  stage.appendChild(strip);
  shell.appendChild(stage);
  viewport.appendChild(shell);

  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const DURATION = reduced ? 0 : 380;
  const EASE = 'cubic-bezier(.22,.61,.36,1)';
  const AUTOPLAY_MS = 5000;

  let timer = null;
  let animating = false;

  // measure height and restore inline styles
  function h(el){
    const prev = {
      position: el.style.position,
      visibility: el.style.visibility,
      transform: el.style.transform,
      opacity: el.style.opacity
    };
    el.style.position = 'relative';
    el.style.visibility = 'hidden';
    el.style.transform = 'none';
    el.style.opacity = '1';
    const r = el.getBoundingClientRect().height;
    el.style.position = prev.position;
    el.style.visibility = prev.visibility;
    el.style.transform = prev.transform;
    el.style.opacity = prev.opacity;
    return r;
  }

  function setStageHeight(px){
    stage.style.height = px + 'px';
  }

  function prepareHeights(nextHTML){
    paneA.innerHTML = contents[index];
    paneB.innerHTML = nextHTML;
    strip.style.transition = 'none';
    strip.style.transform = 'translateY(0)';
    const a = h(paneA);
    const b = h(paneB);
    setStageHeight(Math.max(a, b));
    return { a, b };
  }

  function goTo(newIdx){
    if (animating) return;
    const safeIdx = (newIdx + contents.length) % contents.length;
    if (safeIdx === index) return;
    animating = true;

    const nextHTML = contents[safeIdx];
    prepareHeights(nextHTML);

    requestAnimationFrame(() => {
      if (DURATION === 0) {
        strip.style.transform = 'translateY(-100%)';
        finish();
      } else {
        strip.style.transition = `transform ${DURATION}ms ${EASE}`;
        strip.style.transform = 'translateY(-100%)';
        const end = () => { strip.removeEventListener('transitionend', end); finish(); };
        strip.addEventListener('transitionend', end);
        setTimeout(finish, DURATION + 50);
      }
    });

    function finish(){
      index = safeIdx;
      paneA.innerHTML = contents[index];
      paneB.innerHTML = '';
      strip.style.transition = 'none';
      strip.style.transform = 'translateY(0)';
      setStageHeight(h(paneA));
      animating = false;
    }
  }

  function next(n = 1){ goTo(index + n); }
  function play(){ stop(); if (!reduced) timer = setInterval(() => next(1), AUTOPLAY_MS); }
  function stop(){ if (timer) { clearInterval(timer); timer = null; } }

  setStageHeight(h(paneA));
  play();

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

/* ============ CONTACT FORM: submit via fetch y toast post envio ============ */
document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('contactForm');
  if (!form) return;

  const FORMSPARK_URL = 'https://submit-form.com/Po4c9Fm5U';

  // remover redirect si existiera
  form.querySelector('input[name="_redirect"]')?.remove();

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    e.stopImmediatePropagation();

    const submitBtn = form.querySelector('[type="submit"]');
    const hp = form.querySelector('input[name="_gotcha"]');
    if (hp && hp.value) return;

    try {
      submitBtn?.setAttribute('disabled', 'true');

      // serialize como form clásico
      const params = new URLSearchParams();
      for (const [k, v] of new FormData(form).entries()) {
        params.append(k, typeof v === 'string' ? v : String(v));
      }

      const res = await fetch(FORMSPARK_URL, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8'
        },
        body: params.toString()
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        showErrorToast(data.message || 'Submission failed. Please try again.');
        return;
      }

      form.reset();
      showSuccessToast('Thanks. We will get back to you soon.');
    } catch (_) {
      showErrorToast('Network error. Please try again.');
    } finally {
      submitBtn?.removeAttribute('disabled');
    }
  }, { capture: true });
});

/* ============ TOAST HELPERS ============ */
function ensureToast(){
  let t = document.getElementById('toast');
  if (!t){
    t = document.createElement('div');
    t.id = 'toast';
    t.setAttribute('role','status');
    t.setAttribute('aria-live','polite');
    t.setAttribute('aria-atomic','true');
    document.body.appendChild(t);
  }
  return t;
}

function showSuccessToast(msg = 'Your message was sent successfully.', timeoutMs = 3500){
  const toastEl = ensureToast();
  toastEl.innerHTML = `<div class="card">${msg}</div>`;
  toastEl.classList.add('show');
  clearTimeout(showSuccessToast._t);
  showSuccessToast._t = setTimeout(() => toastEl.classList.remove('show'), timeoutMs);
}

function showErrorToast(msg = 'Submission failed. Please try again.', timeoutMs = 5500){
  const toastEl = ensureToast();
  toastEl.innerHTML = `<div class="card error">${msg}</div>`;
  toastEl.classList.add('show');
  clearTimeout(showErrorToast._t);
  showErrorToast._t = setTimeout(() => toastEl.classList.remove('show'), timeoutMs);
}


(async () => {
  const slot = document.getElementById('footer-slot');
  if (!slot) return;

  // resolve URL (use absolute path or data-src)
  const url = slot.getAttribute('data-src') || '/partials/footer.html';

  try {
    const res = await fetch(url, { cache: 'no-cache' }); // avoid stale during dev
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const html = await res.text();

    // replace the slot with the loaded footer markup
    slot.insertAdjacentHTML('afterend', html);
    slot.remove();
  } catch (err) {
    console.error('Footer load failed:', err);
    // optional minimal fallback so the page is not empty
    slot.outerHTML = '<footer class="site-footer"><div class="container-wide foot-wrap"><p class="foot-copy">© 2025</p></div></footer>';
  }
})();


  // Toggle aria-expanded for hamburguesa
  document.addEventListener('DOMContentLoaded', () => {
    const btn = document.querySelector('.nav-toggle');
    if (!btn) return;
    btn.addEventListener('click', () => {
      const isOpen = btn.getAttribute('aria-expanded') === 'true';
      btn.setAttribute('aria-expanded', String(!isOpen));
    });
  });

  // close menu

  document.addEventListener('DOMContentLoaded', () => {
    const btn = document.querySelector('.nav-toggle');
    const header = document.querySelector('header.container-wide');
    const closeBtn = document.querySelector('.nav-close');
    if (!btn || !header) return;
  
    const setOpen = (open) => {
      btn.setAttribute('aria-expanded', String(open));
      header.classList.toggle('nav-open', open);
      document.body.classList.toggle('nav-open', open);
    };
  
    btn.addEventListener('click', () => {
      const open = btn.getAttribute('aria-expanded') === 'true';
      setOpen(!open);
    });
  
    if (closeBtn) {
      closeBtn.addEventListener('click', () => setOpen(false));
    }
  });