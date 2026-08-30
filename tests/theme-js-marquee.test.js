import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadThemeJs } from './helpers/load-theme-js.js';

/*
  <marquee-band>'s pause logic, exercised without a DOM.

  The browser pane used for visual review never delivers IntersectionObserver
  callbacks — a control observer attached to the same element stayed silent too
  — so the offscreen behaviour cannot be confirmed by driving the real page.
  Here the observer callback is captured and called directly, which tests the
  branch that matters rather than the browser's scheduling.
*/

/** A <marquee-band> instance with just enough DOM around it to connect. */
async function mountBand() {
  const sandbox = await loadThemeJs();

  let observed = null;
  let callback = null;
  sandbox.IntersectionObserver = class {
    constructor(fn) {
      callback = fn;
    }
    observe(target) {
      observed = target;
    }
    disconnect() {
      observed = null;
    }
  };

  const MarqueeBand = sandbox.customElements.get('marquee-band');
  assert.equal(typeof MarqueeBand, 'function', 'marquee-band is not registered');

  const attributes = {};
  const toggle = {
    dataset: { labelPause: 'Pause the moving text', labelResume: 'Resume the moving text' },
    setAttribute: (name, value) => {
      attributes[name] = value;
    },
    addEventListener: (type, handler) => {
      if (type === 'click') toggle.click = handler;
    },
  };
  const label = { textContent: 'Pause the moving text' };
  const glyph = { textContent: '' };

  const band = Object.create(MarqueeBand.prototype);
  band.dataset = { paused: 'false' };
  band.querySelector = (selector) => {
    if (selector.includes('toggle')) return toggle;
    if (selector.includes('label')) return label;
    if (selector.includes('glyph')) return glyph;
    return null;
  };

  band.connectedCallback();
  return {
    band,
    toggle,
    label,
    attributes,
    scroll: (isIntersecting) => callback([{ isIntersecting }]),
    isObserved: () => observed === band,
  };
}

test('the band observes itself so it can stop when it leaves the screen', async () => {
  const { isObserved } = await mountBand();
  assert.ok(isObserved(), 'the band never registered with the observer');
});

test('an offscreen band stops animating, and starts again on the way back', async () => {
  // An animation that is never paused holds a compositor layer awake for the
  // life of the page, including while the band is nowhere near the viewport.
  const { band, scroll } = await mountBand();

  scroll(false);
  assert.equal(band.dataset.paused, 'true');

  scroll(true);
  assert.equal(band.dataset.paused, 'false');
});

test('a band the reader paused stays paused when it scrolls back into view', async () => {
  // The observer suspends an already-running band. It must never undo a
  // deliberate choice: scrolling past is not consent to start moving again.
  const { band, toggle, scroll } = await mountBand();

  toggle.click();
  assert.equal(band.dataset.paused, 'true');

  scroll(false);
  scroll(true);
  assert.equal(band.dataset.paused, 'true', 'the observer overrode the reader');
});

test('the button announces the action it will perform, not the state it is in', async () => {
  const { toggle, label, attributes } = await mountBand();

  assert.equal(attributes['aria-pressed'], undefined, 'nothing is pressed before a click');

  toggle.click();
  assert.equal(attributes['aria-pressed'], 'true');
  assert.equal(label.textContent, 'Resume the moving text');

  toggle.click();
  assert.equal(attributes['aria-pressed'], 'false');
  assert.equal(label.textContent, 'Pause the moving text');
});

test('a band with no control renders no observer, rather than unstoppable motion', async () => {
  const sandbox = await loadThemeJs();
  let constructed = false;
  sandbox.IntersectionObserver = class {
    constructor() {
      constructed = true;
    }
    observe() {}
  };

  const MarqueeBand = sandbox.customElements.get('marquee-band');
  const band = Object.create(MarqueeBand.prototype);
  band.dataset = {};
  band.querySelector = () => null;

  band.connectedCallback();
  assert.equal(constructed, false);
});
