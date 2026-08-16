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

/**
 * Find the variant whose option values are exactly the ones selected.
 * Order matters: index 0 is option one, index 1 is option two.
 *
 * @param {Array<{options: string[]}>} variants
 * @param {string[]} selected
 * @returns {object|null}
 */
window.AzouzTheme.findMatchingVariant = function findMatchingVariant(variants, selected) {
  if (!Array.isArray(variants) || !Array.isArray(selected) || selected.length === 0) return null;

  return (
    variants.find((variant) => {
      const values = variant.options ?? [];
      if (values.length !== selected.length) return false;
      return values.every((value, index) => value === selected[index]);
    }) ?? null
  );
};

/**
 * <variant-picker> drives the option selects.
 *
 * It creates the hidden name="id" input itself, so with scripting off the only
 * field named "id" is the one inside <noscript>. It updates the price, the
 * add-to-cart button and the address bar as the selection changes.
 */
class VariantPicker extends HTMLElement {
  connectedCallback() {
    const data = this.querySelector('[data-variant-data]');
    if (!data) return;

    try {
      this.variants = JSON.parse(data.textContent);
    } catch {
      return; // malformed data must not take the page down
    }

    this.selects = Array.from(this.querySelectorAll('[data-option-index]'));
    if (this.selects.length === 0) return;

    this.root = this.closest('[data-product-root]') ?? document;
    this.message = this.querySelector('[data-variant-unavailable]');

    this.input = document.createElement('input');
    this.input.type = 'hidden';
    this.input.name = 'id';
    const form = this.closest('form');
    if (form) form.appendChild(this.input);
    else this.appendChild(this.input);

    this.addEventListener('change', () => this.update());
    this.update();
  }

  update() {
    const selected = this.selects.map((select) => select.value);
    const variant = window.AzouzTheme.findMatchingVariant(this.variants, selected);

    const button = this.root.querySelector('[data-add-to-cart]');
    const price = this.root.querySelector('[data-product-price]');

    if (!variant) {
      this.input.value = '';
      if (this.message) this.message.hidden = false;
      if (button) button.disabled = true;
      return;
    }

    this.input.value = variant.id;
    if (this.message) this.message.hidden = true;
    if (price) price.textContent = variant.price;

    if (button) {
      button.disabled = !variant.available;
      const label = variant.available ? button.dataset.labelAdd : button.dataset.labelSoldOut;
      if (label) button.textContent = label;
    }

    if (variant.url && window.history?.replaceState) {
      window.history.replaceState({}, '', variant.url);
    }
  }
}

if (!customElements.get('variant-picker')) {
  customElements.define('variant-picker', VariantPicker);
}

/**
 * <product-form> upgrades a real <form action="/cart/add"> into an async add.
 *
 * It wraps the submit button, not the form — the {% form %} tag owns the form
 * element — and walks up to it. With scripting off the form posts natively and
 * the customer lands on /cart, which is fully functional.
 */
class ProductForm extends HTMLElement {
  connectedCallback() {
    this.form = this.closest('form');
    this.button = this.querySelector('[type="submit"]');
    if (!this.form) return;

    this.form.addEventListener('submit', (event) => this.onSubmit(event));
  }

  async onSubmit(event) {
    event.preventDefault();
    if (this.button) this.button.setAttribute('aria-busy', 'true');

    try {
      const response = await fetch('/cart/add', {
        method: 'POST',
        headers: { Accept: 'application/json' },
        body: new FormData(this.form),
      });

      if (!response.ok) throw new Error(`add to cart failed: ${response.status}`);

      document.dispatchEvent(new CustomEvent('cart:updated', { detail: await response.json() }));
    } catch {
      // Anything unexpected: hand the browser back the plain form post.
      this.form.submit();
    } finally {
      if (this.button) this.button.removeAttribute('aria-busy');
    }
  }
}

if (!customElements.get('product-form')) {
  customElements.define('product-form', ProductForm);
}

/**
 * <cart-drawer> shows the cart without a page load.
 *
 * It refreshes itself through Shopify's Section Rendering API and replaces only
 * the inner content region, so the element and its listeners survive. The
 * markup is a <dialog> with no `open` attribute: inert until showModal(), which
 * means a page with scripting disabled behaves as though the drawer is not
 * there and the header cart link simply navigates to /cart.
 */
class CartDrawer extends HTMLElement {
  connectedCallback() {
    this.dialog = this.querySelector('dialog');
    if (!this.dialog) return;

    this.querySelectorAll('[data-drawer-close]').forEach((button) => {
      button.addEventListener('click', () => this.dialog.close());
    });

    // Clicking the backdrop closes the dialog.
    this.dialog.addEventListener('click', (event) => {
      if (event.target === this.dialog) this.dialog.close();
    });

    this.dialog.addEventListener('close', () => {
      this.setAttribute('hidden', '');
      this.setAttribute('aria-hidden', 'true');
      this.dialog.setAttribute('inert', '');
      this.dialog.setAttribute('aria-hidden', 'true');
      this.dialog.setAttribute('hidden', '');
    });

    const link = document.querySelector('[data-cart-link]');
    if (link) {
      link.addEventListener('click', (event) => {
        event.preventDefault();
        this.open();
      });
    }

    document.addEventListener('cart:updated', () => this.refresh());
  }

  open() {
    this.removeAttribute('hidden');
    this.removeAttribute('aria-hidden');
    this.dialog.removeAttribute('inert');
    this.dialog.removeAttribute('aria-hidden');
    this.dialog.removeAttribute('hidden');
    if (typeof this.dialog.showModal === 'function') this.dialog.showModal();
    else window.location.href = '/cart';
  }

  async refresh() {
    try {
      const response = await fetch(`${window.location.pathname}?sections=cart-drawer,header`);
      if (!response.ok) throw new Error(`section render failed: ${response.status}`);

      const sections = await response.json();
      const parsed = new DOMParser().parseFromString(sections['cart-drawer'] ?? '', 'text/html');

      const fresh = parsed.querySelector('[data-drawer-content]');
      const current = this.querySelector('[data-drawer-content]');
      if (fresh && current) current.innerHTML = fresh.innerHTML;

      const header = new DOMParser().parseFromString(sections.header ?? '', 'text/html');
      const freshCount = header.querySelector('[data-cart-count]');
      const currentCount = document.querySelector('[data-cart-count]');
      if (freshCount && currentCount) currentCount.textContent = freshCount.textContent;
    } catch {
      // Leave the drawer showing whatever it last had; /cart is still correct.
    }

    this.open();
  }
}

if (!customElements.get('cart-drawer')) {
  customElements.define('cart-drawer', CartDrawer);
}
