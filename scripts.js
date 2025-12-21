/* ============ SAFE MARQUEE ============ */
(() => {
  const marquee = document.getElementById('marquee');
  if (!marquee) return;
  marquee.addEventListener('mouseenter', () => marquee.style.animationPlayState = 'paused');
  marquee.addEventListener('mouseleave', () => marquee.style.animationPlayState = 'running');
  window.setMarqueeSpeed = s => marquee.style.animationDuration = s + 's';
})();

/* ============ TESTIMONIALS (single fixed card, content slides + cross-fade, mobile-safe) ============ */
document.addEventListener('DOMContentLoaded', () => {
  const wrap = document.getElementById('tstCarousel');
  if (!wrap) return;

  const viewport = wrap.querySelector('.tst-viewport');
  if (!viewport) return;

  const slides = Array.from(viewport.querySelectorAll('.tst-card'));
  if (!slides.length) return;

  const prevBtn = wrap.querySelector('.tst-prev');
  const nextBtn = wrap.querySelector('.tst-next');

  const contents = slides.map(s => s.innerHTML);
  let index = slides.findIndex(s => s.classList.contains('is-active'));
  if (index < 0) index = 0;

  // build fixed card
  viewport.innerHTML = '';
  const shell = document.createElement('article');
  shell.className = 'tst-card is-active';

  const stage = document.createElement('div');
  stage.style.overflow = 'hidden';
  stage.style.position = 'relative';
  stage.style.display = 'flex';
  stage.style.flex = '1 1 auto';
  stage.style.minHeight = '0';

  const strip = document.createElement('div');
  strip.style.display = 'flex';
  strip.style.flexDirection = 'column';
  strip.style.willChange = 'transform';
  strip.style.flex = '1 1 auto';
  strip.style.minHeight = '0';

  const paneA = document.createElement('div');
  const paneB = document.createElement('div');

  [paneA, paneB].forEach(p => {
    p.style.display = 'flex';
    p.style.flexDirection = 'column';
    p.style.minHeight = '100%';
    p.style.willChange = 'opacity'; // for fade
  });

  paneA.innerHTML = contents[index];
  paneB.innerHTML = '';

  strip.appendChild(paneA);
  strip.appendChild(paneB);
  stage.appendChild(strip);
  shell.appendChild(stage);
  viewport.appendChild(shell);

  // timings
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isMobile = () => matchMedia('(max-width:760px)').matches;
  const DURATION = reduced ? 0 : 700;   // slower movement
  const FADE_OUT_MS = reduced ? 0 : 800;   // slightly longer fade out
  const FADE_IN_MS = reduced ? 0 : 650;   // fade in
  const FADE_IN_DELAY = reduced ? 0 : 120;   // enters shortly after
  const EASE = 'cubic-bezier(.22,.61,.36,1)';
  const AUTOPLAY_MS = 6000;

  let timer = null;
  let animating = false;

  // safe height measure
  function measure(el) {
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
    Object.assign(el.style, prev);
    return r;
  }

  const lockStageHeight = px => stage.style.height = px + 'px';
  const unlockStageHeight = () => stage.style.height = '';

  function prepare(nextHTML) {
    paneA.innerHTML = contents[index];
    paneB.innerHTML = nextHTML;

    // reset strip
    strip.style.transition = 'none';
    strip.style.transform = 'translateY(0)';

    // reset fades
    paneA.style.transition = 'none';
    paneB.style.transition = 'none';
    paneA.style.opacity = '1';
    paneB.style.opacity = '0';

    // lock height on mobile to avoid jump
    const hA = measure(paneA);
    if (isMobile()) lockStageHeight(hA);
    else unlockStageHeight();
  }

  function goTo(newIdx) {
    if (animating) return;
    const safeIdx = (newIdx + contents.length) % contents.length;
    if (safeIdx === index) return;
    animating = true;

    const nextHTML = contents[safeIdx];
    prepare(nextHTML);

    requestAnimationFrame(() => {
      if (DURATION === 0) {
        paneA.style.opacity = '0';
        paneB.style.opacity = '1';
        strip.style.transform = 'translateY(-100%)';
        finish();
        return;
      }

      // animate slide + cross-fade
      strip.style.transition = `transform ${DURATION}ms ${EASE}`;
      paneA.style.transition = `opacity ${FADE_OUT_MS}ms ${EASE}`;
      paneB.style.transition = `opacity ${FADE_IN_MS}ms ${EASE} ${FADE_IN_DELAY}ms`;

      // triggers
      paneA.style.opacity = '0';
      paneB.style.opacity = '1';
      strip.style.transform = 'translateY(-100%)';

      const end = () => { strip.removeEventListener('transitionend', end); finish(); };
      strip.addEventListener('transitionend', end);
      setTimeout(finish, Math.max(DURATION, FADE_OUT_MS, FADE_IN_MS + FADE_IN_DELAY) + 80);
    });

    function finish() {
      index = safeIdx;
      paneA.innerHTML = contents[index];
      paneB.innerHTML = '';

      // cleanup
      strip.style.transition = 'none';
      strip.style.transform = 'translateY(0)';
      paneA.style.transition = paneB.style.transition = 'none';
      paneA.style.opacity = '1';
      paneB.style.opacity = '';

      // release lock after swap (mobile)
      if (isMobile()) unlockStageHeight();

      animating = false;
    }
  }

  function next(n = 1) { goTo(index + n); }
  function play() { stop(); if (!reduced) timer = setInterval(() => next(1), AUTOPLAY_MS); }
  function stop() { if (timer) { clearInterval(timer); timer = null; } }

  // init
  play();

  prevBtn?.addEventListener('click', () => { next(-1); play(); });
  nextBtn?.addEventListener('click', () => { next(1); play(); });

  wrap.addEventListener('mouseenter', stop);
  wrap.addEventListener('mouseleave', play);
  wrap.addEventListener('focusin', stop);
  wrap.addEventListener('focusout', play);

  wrap.addEventListener('keydown', e => {
    if (e.key === 'ArrowLeft') { next(-1); play(); }
    if (e.key === 'ArrowRight') { next(1); play(); }
  });

  // on resize, just release any lock so the layout can settle
  addEventListener('resize', () => { if (!animating) unlockStageHeight(); }, { passive: true });
});

/* ============ CONTACT FORM: submit via fetch with toast ============ */
document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('contactForm');
  if (!form) return;

  const FORMSPARK_URL = 'https://submit-form.com/Po4c9Fm5U';

  // remove redirect if present
  form.querySelector('input[name="_redirect"]')?.remove();

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    e.stopImmediatePropagation();

    const submitBtn = form.querySelector('[type="submit"]');
    const hp = form.querySelector('input[name="_gotcha"]');
    if (hp && hp.value) return;

    try {
      submitBtn?.setAttribute('disabled', 'true');

      // serialize like a classic form
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
function ensureToast() {
  let t = document.getElementById('toast');
  if (!t) {
    t = document.createElement('div');
    t.id = 'toast';
    t.setAttribute('role', 'status');
    t.setAttribute('aria-live', 'polite');
    t.setAttribute('aria-atomic', 'true');
    document.body.appendChild(t);
  }
  return t;
}

const docEl = document.documentElement;
let toastTimer = null;

function hideToastAfterDelay(toastEl, timeoutMs) {
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toastEl.classList.remove('show');
  }, timeoutMs);
}

function showToast(msg, { variant = 'success', timeoutMs = 3500 } = {}) {
  const toastEl = ensureToast();
  const isError = variant === 'error';
  toastEl.innerHTML = `<div class="card${isError ? ' error' : ''}">${msg}</div>`;
  toastEl.classList.add('show');
  hideToastAfterDelay(toastEl, timeoutMs);
}

function showSuccessToast(msg = 'Your message was sent successfully.', timeoutMs = 3500) {
  showToast(msg, { variant: 'success', timeoutMs });
}

function showErrorToast(msg = 'Submission failed. Please try again.', timeoutMs = 5500) {
  showToast(msg, { variant: 'error', timeoutMs });
}

/* ============ LOAD FOOTER PARTIAL ============ */
(async () => {
  const slot = document.getElementById('footer-slot');
  if (!slot) return;

  const url = slot.getAttribute('data-src') || '/partials/footer.html';

  try {
    const res = await fetch(url, { cache: 'no-cache' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const html = await res.text();

    slot.insertAdjacentHTML('afterend', html);
    slot.remove();
  } catch (err) {
    console.error('Footer load failed:', err);
    slot.outerHTML = '<footer class="site-footer"><div class="container-wide foot-wrap"><p class="foot-copy">© 2025</p></div></footer>';
  }
})();

/* ============ MOBILE NAV ============ */
document.addEventListener('DOMContentLoaded', () => {
  const header = document.querySelector('header.container-wide');
  const btn = header?.querySelector('.nav-toggle');
  const nav = header?.querySelector('.nav');
  const closeBtn = header?.querySelector('.nav-close');
  if (!header || !btn || !nav) return;

  const setOpen = (open) => {
    btn.setAttribute('aria-expanded', String(open));
    header.classList.toggle('nav-open', open);   // CSS fallback for no :has()
    document.body.classList.toggle('nav-open', open);
  };

  btn.addEventListener('click', () => {
    const open = btn.getAttribute('aria-expanded') === 'true';
    setOpen(!open);
  });

  closeBtn?.addEventListener('click', () => setOpen(false));

  nav.addEventListener('click', (e) => {
    const a = e.target.closest('a');
    if (a) setOpen(false);
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') setOpen(false);
  });
});
