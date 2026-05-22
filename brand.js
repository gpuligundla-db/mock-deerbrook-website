// Deer Brook — small shared behaviors

// Inline mark used in <span class="brand"><span class="mark"></span>...</span>
window.DB_MARK_SVG = `
<svg viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <path d="M3 19 C 6 11, 10 7, 11 3 C 12 7, 16 11, 19 19" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M7 14 C 9 13, 13 13, 15 14" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>
</svg>`;

function dbHydrateMarks() {
  document.querySelectorAll('.brand').forEach((el) => {
    if (el.dataset.dbLogoHydrated) return;
    el.dataset.dbLogoHydrated = '1';
    // Build lockup: light + dark logo + (visually-hidden) wordmark for a11y
    const light = document.createElement('img');
    light.className = 'logo for-light';
    light.src = (el.dataset.logoBase || 'assets/') + 'logo-light.png';
    light.alt = 'Deer Brook';
    const dark = document.createElement('img');
    dark.className = 'logo for-dark';
    dark.src = (el.dataset.logoBase || 'assets/') + 'logo-dark.png';
    dark.alt = '';
    dark.setAttribute('aria-hidden', 'true');
    // Replace contents (keep accessible label via aria-label on the link)
    if (!el.getAttribute('aria-label')) el.setAttribute('aria-label', 'Deer Brook — home');
    el.innerHTML = '';
    el.appendChild(light);
    el.appendChild(dark);
  });
}

// Reveal-on-scroll: idempotent. Safe to call multiple times — only
// observes elements that haven't been observed yet.
const _dbRevealSeen = new WeakSet();
let _dbRevealObs = null;
function dbObserveReveal() {
  if (!('IntersectionObserver' in window)) {
    document.querySelectorAll('.reveal').forEach((el) => el.classList.add('in'));
    return;
  }
  if (!_dbRevealObs) {
    _dbRevealObs = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('in');
            _dbRevealObs.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.08, rootMargin: '0px 0px -5% 0px' }
    );
  }
  document.querySelectorAll('.reveal').forEach((el) => {
    if (_dbRevealSeen.has(el)) return;
    _dbRevealSeen.add(el);
    // If already on-screen at observe time, IntersectionObserver fires immediately.
    _dbRevealObs.observe(el);
  });
}
window.dbObserveReveal = dbObserveReveal;

// Smooth in-page scroll
document.addEventListener('click', (e) => {
  const a = e.target.closest('a[href^="#"]');
  if (!a) return;
  const href = a.getAttribute('href');
  if (href === '#') return;
  const id = href.slice(1);
  const target = id && document.getElementById(id);
  if (target) {
    e.preventDefault();
    window.scrollTo({ top: target.offsetTop - 80, behavior: 'smooth' });
  }
});

// Run hydration on DOMContentLoaded — this fires AFTER any inline scripts
// at the end of the body that add `.reveal` classes dynamically.
function _dbInit() {
  // Favicon injection (safe to add even if page already has one)
  if (!document.querySelector('link[rel="icon"]')) {
    const fav = document.createElement('link');
    fav.rel = 'icon';
    fav.type = 'image/png';
    fav.href = 'assets/favicon.png';
    document.head.appendChild(fav);
  }
  dbHydrateMarks();
  dbObserveReveal();
}
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', _dbInit);
} else {
  _dbInit();
}

// Safety net: if pages add `.reveal` to elements later (e.g. after async
// content loads), call window.dbObserveReveal(). Also re-run shortly
// after load as a belt-and-braces guarantee that nothing stays invisible.
window.addEventListener('load', () => {
  dbObserveReveal();
  // Final fallback: if any .reveal element is in the viewport but somehow
  // missed the observer, force-promote it.
  setTimeout(() => {
    document.querySelectorAll('.reveal:not(.in)').forEach((el) => {
      const r = el.getBoundingClientRect();
      if (r.top < window.innerHeight && r.bottom > 0) el.classList.add('in');
    });
  }, 200);
});
