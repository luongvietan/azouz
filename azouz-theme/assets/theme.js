/*
  Azouz Coffee — theme runtime.
  Vanilla custom elements, no dependencies. Every component degrades to
  working HTML when JavaScript is unavailable.
*/

const prefersReducedMotion = () =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * <reveal-on-scroll> fades its children up as they enter the viewport.
 *
 * Content is visible by default in CSS; this element only *adds* the
 * animation. If the script never runs, or motion is reduced, everything is
 * simply shown — nothing is ever hidden by JavaScript alone.
 */
class RevealOnScroll extends HTMLElement {
  connectedCallback() {
    const targets = this.querySelectorAll('.reveal');
    if (targets.length === 0) return;

    if (prefersReducedMotion() || !('IntersectionObserver' in window)) {
      targets.forEach((element) => element.classList.add('is-visible'));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry, index) => {
          if (!entry.isIntersecting) return;
          entry.target.style.transitionDelay = `${Math.min(index, 6) * 60}ms`;
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        });
      },
      { rootMargin: '0px 0px -10% 0px', threshold: 0.1 },
    );

    targets.forEach((element) => observer.observe(element));
  }
}

if (!customElements.get('reveal-on-scroll')) {
  customElements.define('reveal-on-scroll', RevealOnScroll);
}
