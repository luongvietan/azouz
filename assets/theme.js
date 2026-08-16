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
 * Read the line key out of a cart quantity input's `name` attribute.
 * Cart lines use `updates[<key>]`, which is what `/cart/change` expects as `id`.
 * @param {string} name
 * @returns {string|null}
 */
window.AzouzTheme.parseCartLineKey = function parseCartLineKey(name) {
  if (typeof name !== 'string') return null;
  const match = name.match(/^updates\[(.+)\]$/);
  return match ? match[1] : null;
};

/**
 * POST a single line change and announce it so every cart surface can refresh.
 * @param {string} id
 * @param {number} quantity
 */
window.AzouzTheme.changeCartLine = async function changeCartLine(id, quantity) {
  const response = await fetch('/cart/change', {
    method: 'POST',
    headers: { Accept: 'application/json' },
    body: new URLSearchParams({ id, quantity: String(quantity) }),
  });

  if (!response.ok) throw new Error(`cart change failed: ${response.status}`);

  document.dispatchEvent(new CustomEvent('cart:updated', { detail: await response.json() }));
};

/**
 * Apply a quantity edit from a cart line input.
 * @param {Event} event
 * @param {Element} root
 */
window.AzouzTheme.handleCartQuantityChange = async function handleCartQuantityChange(event, root) {
  const input = event.target.closest('.quantity__input');
  if (!input || !root.contains(input)) return;

  const id = window.AzouzTheme.parseCartLineKey(input.name);
  if (!id) return;

  const quantity = window.AzouzTheme.clampQuantity(input.value, 0);
  input.value = quantity;

  await window.AzouzTheme.changeCartLine(id, quantity);
};

/**
 * Remove a cart line through the ajax change endpoint.
 * @param {Event} event
 * @param {Element} root
 */
window.AzouzTheme.handleCartRemoveClick = async function handleCartRemoveClick(event, root) {
  const remove = event.target.closest('.cart-line__remove');
  if (!remove || !root.contains(remove)) return;

  event.preventDefault();

  const url = new URL(remove.href, window.location.origin);
  const id = url.searchParams.get('id');
  if (!id) return;

  await window.AzouzTheme.changeCartLine(id, 0);
};

/**
 * Copy the cart count out of a rendered header section.
 *
 * There are two of them: the badge, which is aria-hidden and purely visual, and
 * the visually-hidden sentence a screen reader actually announces. Both have to
 * move together or the page shows one total and announces another.
 *
 * @param {string} headerHtml
 */
window.AzouzTheme.syncCartCount = function syncCartCount(headerHtml) {
  const header = new DOMParser().parseFromString(headerHtml ?? '', 'text/html');

  for (const hook of ['[data-cart-count]', '[data-cart-count-label]']) {
    const fresh = header.querySelector(hook);
    const current = document.querySelector(hook);
    if (fresh && current) current.textContent = fresh.textContent;
  }
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

/*
  Collection sort submits on change once scripting is available. The form is a
  plain GET with a visible Apply button underneath, which CSS hides only when
  the `js` class is set — so nothing here is load-bearing.
*/
document.addEventListener('change', (event) => {
  const select = event.target.closest('[data-collection-sort]');
  if (select) select.form?.submit();
});

/**
 * Write a variant's price into a rendered `price` snippet.
 *
 * Only the amounts are touched. Replacing the container's textContent would
 * also delete the visually-hidden "Price" / "Sale price" labels, which is the
 * only thing telling a screen reader what the number is.
 *
 * @param {Element} root the element carrying data-product-price
 * @param {{price: string, compare_at?: string}} variant
 */
window.AzouzTheme.renderPrice = function renderPrice(root, variant) {
  const amount = root.querySelector('[data-price-amount]');
  if (amount) amount.textContent = variant.price;
  else root.textContent = variant.price; // a bare price element, no snippet

  const onSale = Boolean(variant.compare_at);

  const wrapper = root.querySelector('.price') ?? root;
  wrapper.classList.toggle('price--on-sale', onSale);

  // The label has to follow the state, or a full-price variant is still
  // announced as "Sale price".
  const label = root.querySelector('[data-price-label]');
  const labels = wrapper.dataset ?? {};
  if (label && labels.labelPrice && labels.labelSale) {
    label.textContent = onSale ? labels.labelSale : labels.labelPrice;
  }

  const compare = root.querySelector('[data-price-compare]');
  if (!compare) return;

  const compareAmount = compare.querySelector('[data-price-compare-amount]');
  if (onSale) {
    if (compareAmount) compareAmount.textContent = variant.compare_at;
    compare.hidden = false;
  } else {
    compare.hidden = true;
  }
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
    if (price) window.AzouzTheme.renderPrice(price, variant);

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

      const detail = await response.json();
      detail.openDrawer = true;
      document.dispatchEvent(new CustomEvent('cart:updated', { detail }));
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
      this.setAttribute('inert', '');
      this.dialog.setAttribute('inert', '');
      this.dialog.setAttribute('aria-hidden', 'true');
      this.dialog.setAttribute('hidden', '');
    });

    this.content = this.querySelector('[data-drawer-content]');
    if (this.content) {
      this.content.addEventListener('change', (event) => this.onLineQuantityChange(event));
      this.content.addEventListener('click', (event) => this.onLineRemoveClick(event));
    }

    const link = document.querySelector('[data-cart-link]');
    if (link) {
      link.addEventListener('click', (event) => {
        event.preventDefault();
        this.open();
      });
    }

    document.addEventListener('cart:updated', (event) => {
      this.refresh();
      if (event.detail?.openDrawer) this.open();
    });
  }

  open() {
    this.removeAttribute('hidden');
    this.removeAttribute('aria-hidden');
    this.removeAttribute('inert');
    this.dialog.removeAttribute('inert');
    this.dialog.removeAttribute('aria-hidden');
    this.dialog.removeAttribute('hidden');
    if (typeof this.dialog.showModal === 'function') {
      if (!this.dialog.open) this.dialog.showModal();
    } else window.location.href = '/cart';
  }

  async onLineQuantityChange(event) {
    try {
      await window.AzouzTheme.handleCartQuantityChange(event, this.content);
    } catch {
      await this.refresh();
    }
  }

  async onLineRemoveClick(event) {
    try {
      await window.AzouzTheme.handleCartRemoveClick(event, this.content);
    } catch {
      await this.refresh();
    }
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

      window.AzouzTheme.syncCartCount(sections.header ?? '');
    } catch {
      // Leave the drawer showing whatever it last had; /cart is still correct.
    }
  }
}

if (!customElements.get('cart-drawer')) {
  customElements.define('cart-drawer', CartDrawer);
}

/**
 * <cart-form> upgrades the cart page so line edits refresh in place.
 *
 * The underlying {% form 'cart' %} still posts for no-js customers; with
 * scripting on, quantity changes and remove controls go through /cart/change
 * and the main-cart section is re-rendered.
 */
class CartForm extends HTMLElement {
  connectedCallback() {
    this.body = this.querySelector('[data-cart-body]');
    if (!this.body) return;

    this.addEventListener('change', (event) => this.onLineQuantityChange(event));
    this.addEventListener('click', (event) => this.onLineRemoveClick(event));
    document.addEventListener('cart:updated', () => this.refresh());
  }

  async onLineQuantityChange(event) {
    try {
      await window.AzouzTheme.handleCartQuantityChange(event, this);
    } catch {
      await this.refresh();
    }
  }

  async onLineRemoveClick(event) {
    try {
      await window.AzouzTheme.handleCartRemoveClick(event, this);
    } catch {
      await this.refresh();
    }
  }

  async refresh() {
    try {
      const response = await fetch(`${window.location.pathname}?sections=main-cart,header,cart-drawer`);
      if (!response.ok) throw new Error(`section render failed: ${response.status}`);

      const sections = await response.json();
      const parsed = new DOMParser().parseFromString(sections['main-cart'] ?? '', 'text/html');
      const fresh = parsed.querySelector('[data-cart-body]');

      if (fresh && this.body) this.body.innerHTML = fresh.innerHTML;

      window.AzouzTheme.syncCartCount(sections.header ?? '');

      const drawer = document.querySelector('cart-drawer');
      const drawerParsed = new DOMParser().parseFromString(sections['cart-drawer'] ?? '', 'text/html');
      const freshContent = drawerParsed.querySelector('[data-drawer-content]');
      const currentContent = drawer?.querySelector('[data-drawer-content]');
      if (freshContent && currentContent) currentContent.innerHTML = freshContent.innerHTML;
    } catch {
      // The form still posts natively; leave the last good markup on screen.
    }
  }
}

if (!customElements.get('cart-form')) {
  customElements.define('cart-form', CartForm);
}

/**
 * Copy text to the clipboard, falling back where the async API is unavailable.
 *
 * navigator.clipboard is undefined on an insecure origin and its promise
 * rejects when the document is not focused, so the execCommand path is not
 * legacy politeness — it is what runs on a real proportion of visits.
 *
 * @param {string} text
 * @returns {Promise<boolean>} whether the copy actually happened
 */
window.AzouzTheme.copyText = async function copyText(text) {
  const value = String(text ?? '').trim();
  if (value === '') return false;

  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(value);
      return true;
    }
  } catch {
    // Fall through to the selection-based path below.
  }

  try {
    const field = document.createElement('textarea');
    field.value = value;
    field.setAttribute('readonly', '');
    field.style.position = 'fixed';
    field.style.opacity = '0';
    document.body.appendChild(field);
    field.select();
    const copied = document.execCommand('copy');
    field.remove();
    return copied;
  } catch {
    return false;
  }
};

/**
 * <gift-card-actions> adds copy and print to the issued gift card.
 *
 * Both need scripting, so both buttons are hidden by CSS until this element
 * upgrades. The code itself is always plain selectable text — these are a
 * convenience over it, never the only way to get at it.
 */
class GiftCardActions extends HTMLElement {
  connectedCallback() {
    this.copyButton = this.querySelector('[data-gift-card-copy]');
    this.printButton = this.querySelector('[data-gift-card-print]');
    this.confirmation = this.querySelector('[data-gift-card-copied]');

    this.copyButton?.addEventListener('click', () => this.copy());
    this.printButton?.addEventListener('click', () => window.print());
  }

  async copy() {
    const code = document.querySelector('[data-gift-card-code]')?.textContent ?? '';
    const copied = await window.AzouzTheme.copyText(code);

    // Nothing is announced unless the copy succeeded — a confirmation that
    // lies is worse than none, because the customer stops checking.
    if (!copied || !this.confirmation) return;

    this.confirmation.hidden = false;
    clearTimeout(this.resetTimer);
    this.resetTimer = setTimeout(() => {
      this.confirmation.hidden = true;
    }, 4000);
  }
}

if (!customElements.get('gift-card-actions')) {
  customElements.define('gift-card-actions', GiftCardActions);
}
