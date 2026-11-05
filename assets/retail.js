/* Progressive enhancement: all product links remain usable without JavaScript. */
class CoffeeGuide extends HTMLElement {
  connectedCallback() {
    if (this.ready) return;
    this.ready = true;
    const select = this.querySelector('[data-guide-method]');
    const products = [...this.querySelectorAll('[data-guide-product]')];
    const empty = this.querySelector('[data-guide-empty]');
    const status = this.querySelector('[data-guide-status]');
    const filter = () => {
      let count = 0;
      for (const product of products) {
        const matches = !select.value || product.dataset.methods.split(',').some(method => method.trim().includes(select.value));
        product.hidden = !matches;
        if (matches) count++;
      }
      empty.hidden = count > 0;
      status.textContent = `${status.dataset.countLabel} ${count}`;
    };
    if (!select || !empty || !status) return;
    this.querySelector('[data-guide-controls]').hidden = false;
    select.addEventListener('change', filter);
    filter();
  }
}
if (!customElements.get('coffee-guide')) customElements.define('coffee-guide', CoffeeGuide);
