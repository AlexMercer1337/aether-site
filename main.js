const screens = {
  study: {
    image: 'assets/study-plan.jpg',
    mobile: 'assets/study-plan-mobile.jpg',
    alt: 'Учебный курс «Алгоритмы и структуры данных»: прогресс 67 процентов, пройдено 8 из 12 тем.',
    caption: '01 / Курс: пройдено 8 из 12 тем. Выделен текущий прогресс.',
  },
  next: {
    image: 'assets/study-next.jpg',
    mobile: 'assets/study-next-mobile.jpg',
    alt: 'Неизученные темы курса: динамическое программирование, жадные алгоритмы, рекурсия и финальный проект.',
    caption: '02 / Неизученные темы. Выделен следующий пункт — динамическое программирование.',
  },
};
const image = document.getElementById('demo-image');
const mobile = document.getElementById('demo-mobile-source');
const caption = document.getElementById('demo-caption');
const buttons = document.querySelectorAll('[data-screen]');
const demoScreen = document.querySelector('.demo-screen');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
function updatePageVisibility() {
  document.documentElement.classList.toggle('page-hidden', document.hidden);
}
document.addEventListener('visibilitychange', updatePageVisibility);
updatePageVisibility();
let screenRequest = 0;
let imageAnimation;
let captionAnimation;

function cancelScreenAnimation() {
  imageAnimation?.cancel();
  captionAnimation?.cancel();
}

reducedMotion.addEventListener('change', () => {
  if (reducedMotion.matches) {
    screenRequest++;
    cancelScreenAnimation();
  }
});
window.addEventListener('pagehide', () => {
  screenRequest++;
  cancelScreenAnimation();
});

for (const button of buttons) {
  button.addEventListener('click', () => {
    const screen = screens[button.dataset.screen];
    if (!screen || button.getAttribute('aria-pressed') === 'true') return;
    const request = ++screenRequest;
    cancelScreenAnimation();
    mobile.srcset = screen.mobile;
    image.src = screen.image;
    image.alt = screen.alt;
    demoScreen.dataset.frame = button.dataset.screen;
    caption.textContent = screen.caption;
    for (const candidate of buttons) {
      const active = candidate === button;
      candidate.classList.toggle('active', active);
      candidate.setAttribute('aria-pressed', String(active));
    }
    if (reducedMotion.matches) return;
    void image.decode().then(() => {
      if (request !== screenRequest || !image.isConnected || reducedMotion.matches) return;
      imageAnimation = image.animate(
        [{ opacity: .35, transform: 'translateY(3px)' }, { opacity: 1, transform: 'translateY(0)' }],
        { duration: 240, easing: 'cubic-bezier(.2,.8,.2,1)' },
      );
      captionAnimation = caption.animate([{ opacity: .4 }, { opacity: 1 }], { duration: 240 });
    }).catch(() => {
      // A failed image still exposes its alt text; switching remains available.
    });
  });
}

// Follow page sections independently of the visual order of header links.
const header = document.querySelector('.header');
const backToTop = document.querySelector('.back-to-top');
const pageFooter = document.querySelector('.footer');
const sectionLinks = [...document.querySelectorAll('.header [data-section-link]')].map(link => ({
  link,
  section: document.getElementById(link.hash.slice(1)),
})).filter(entry => entry.section);
let navigationFrame = 0;
function updateNavigation() {
  navigationFrame = 0;
  if (backToTop) {
    const atTop = window.scrollY <= 8;
    if (atTop && document.activeElement === backToTop) header?.querySelector('.brand')?.focus({ preventScroll: true });
    backToTop.hidden = atTop;
    if (!atTop && pageFooter) {
      const bodyScale = Number.parseFloat(getComputedStyle(document.body).zoom) || 1;
      const footerGap = Number.parseFloat(getComputedStyle(backToTop).getPropertyValue('--back-top-footer-gap')) || 24;
      const clearance = Math.max(0, (window.innerHeight - pageFooter.getBoundingClientRect().top) / bodyScale + footerGap);
      const nextClearance = `${Math.round(clearance * 100) / 100}px`;
      if (backToTop.style.getPropertyValue('--back-top-footer-clearance') !== nextClearance) {
        backToTop.style.setProperty('--back-top-footer-clearance', nextClearance);
      }
    }
  }
  const bar = document.querySelector('.background-tools, .sketch-tools') || header;
  // A compact page can reach its end before the last section meets the header.
  const atPageEnd = window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 2;
  const readingLine = atPageEnd ? window.innerHeight : Math.max(0, bar.getBoundingClientRect().bottom) + 48;
  let current = null;
  let closestTop = -Infinity;
  for (const entry of sectionLinks) {
    const top = entry.section.getBoundingClientRect().top;
    if (top <= readingLine && top > closestTop) {
      current = entry.link;
      closestTop = top;
    }
  }
  for (const { link } of sectionLinks) {
    if (link === current) link.setAttribute('aria-current', 'location');
    else link.removeAttribute('aria-current');
  }
}
function scheduleNavigation() {
  if (!navigationFrame) navigationFrame = requestAnimationFrame(updateNavigation);
}
window.addEventListener('scroll', scheduleNavigation, { passive: true });
window.addEventListener('resize', scheduleNavigation);
const footerLayoutObserver = pageFooter && typeof ResizeObserver === 'function' ? new ResizeObserver(scheduleNavigation) : null;
function observeNavigationLayout() {
  footerLayoutObserver?.observe(document.body);
  scheduleNavigation();
}
window.addEventListener('pageshow', observeNavigationLayout);
window.addEventListener('pagehide', () => {
  cancelAnimationFrame(navigationFrame);
  navigationFrame = 0;
  footerLayoutObserver?.disconnect();
});
observeNavigationLayout();
