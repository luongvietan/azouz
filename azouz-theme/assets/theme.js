/*
  Azouz Coffee — theme runtime.
  Vanilla custom elements, no dependencies. Every component degrades to
  working HTML when JavaScript is unavailable.
*/

/*
  Pure logic lives on one global namespace so it can be unit-tested by loading
  this exact file into a sandbox — see tests/helpers/load-theme-js.js.

  This file must stay a classic script. It is loaded with <script defer>, so
  `import` or `export` anywhere in it would stop the entire runtime from
  parsing and silently disable every component below.
*/
window.AzouzTheme = window.AzouzTheme || {};

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

/**
 * Coerce whatever is in a quantity field into a usable whole number.
 * @param {unknown} value
 * @param {number} min
 * @param {number} [max]
 */
window.AzouzTheme.clampQuantity = function clampQuantity(value, min = 1, max = Infinity) {
  const parsed = Math.floor(Number(value));
  if (!Number.isFinite(parsed)) return min;
  return Math.min(Math.max(parsed, min), max);
};

/**
 * <quantity-input> turns its two buttons into a stepper.
 * The <input type="number"> inside works on its own without this.
 */
class QuantityInput extends HTMLElement {
  connectedCallback() {
    this.input = this.querySelector('input');
    if (!this.input) return;

    this.addEventListener('click', (event) => {
      const button = event.target.closest('[data-quantity-step]');
      if (!button) return;

      const min = Number(this.input.min || 1);
      const max = this.input.max === '' ? Infinity : Number(this.input.max);
      const next = Number(this.input.value) + Number(button.dataset.quantityStep);

      this.input.value = window.AzouzTheme.clampQuantity(next, min, max);
      this.input.dispatchEvent(new Event('change', { bubbles: true }));
    });
  }
}

if (!customElements.get('quantity-input')) {
  customElements.define('quantity-input', QuantityInput);
}
