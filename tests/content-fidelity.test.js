import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createEngine } from '../preview/engine.js';
import { renderTemplate } from '../preview/template-renderer.js';
import { THEME_DIR } from '../scripts/theme-paths.js';

/*
  The client supplied the copy for all four marketing pages. Sections and lists
  were abridged during implementation, so the live site was missing whole blocks
  the client had written and paid for:

    private-label  missing "Your Blend or Ours." and "Who We Work With"
    wholesale      missing "Create Your Own House Blend."
    index          audience list 4 of 6
    our-brands     retail formats 5 of 8

  This test treats the supplied copy as the acceptance criterion. If a list item
  or a named block disappears from a template again, it fails here rather than
  in front of the client.
*/

const render = async (name) =>
  renderTemplate(await createEngine(THEME_DIR), THEME_DIR, `templates/${name}`);

/** Text with entities decoded and whitespace collapsed, so assertions match what a reader sees. */
const readable = (html) =>
  html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&#39;|&rsquo;/g, "'")
    .replace(/&middot;/g, '·')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ');

async function expectAll(template, items) {
  const text = readable(await render(template));
  const missing = items.filter((item) => !text.includes(item));
  assert.deepEqual(missing, [], `${template} is missing copy the client supplied`);
}

test('home lists all six business types the client named', async () => {
  await expectAll('index.json', [
    'Cafés', 'Hotels', 'Restaurants', 'Retailers', 'Distributors', 'Coffee Brands',
  ]);
});

test('private label lists all eight coffee types the client named', async () => {
  await expectAll('page.private-label.json', [
    'Espresso blends', 'Specialty coffee', 'Single-origin coffee', 'Turkish coffee',
    'Arabic coffee', 'Filter coffee', 'Whole bean coffee', 'Ground coffee',
  ]);
});

test('private label keeps the "Your Blend or Ours." choice block', async () => {
  await expectAll('page.private-label.json', [
    'Your Blend or Ours.',
    'Choose One of Our Existing Blends',
    'A faster option if you want to launch quickly.',
    'Create Your Own Blend',
  ]);
});

test('private label keeps the "Who We Work With" audience block', async () => {
  await expectAll('page.private-label.json', [
    'Who We Work With',
    'Coffee Shops', 'Retailers', 'Hotels', 'Restaurants', 'Distributors', 'Startups', 'Supermarkets',
  ]);
});

test('wholesale keeps the "Create Your Own House Blend." section', async () => {
  await expectAll('page.wholesale.json', [
    'Create Your Own House Blend.',
    'Body', 'Sweetness', 'Acidity', 'Roast Level', 'Arabica/Robusta Ratio', 'Flavour Profile',
  ]);
});

test('wholesale lists all six business types the client named', async () => {
  await expectAll('page.wholesale.json', [
    'Coffee Shops', 'Restaurants', 'Hotels', 'Offices', 'Retailers', 'Distributors',
  ]);
});

test('private label carries the white label espresso blend the client described', async () => {
  await expectAll('page.private-label.json', [
    'Our white label espresso blend.',
    'Dark chocolate, toasted nuts and caramel sweetness.',
    'Medium-dark roast',
    'Private or quiet label',
    'Bulk or portion packs',
    'Fresh roasted',
  ]);
});

/*
  The client rewrote the coffee-shop page end to end on 11 September 2026. The
  franchise pitch that used to close it ("Want to pour Azouz in your
  neighbourhood?") went with the rewrite, by their hand: what they sent is the
  page now, and every heading, every point of every list and every call to
  action in it is held below.

  One edit was made on the way in. "Imagine your own Azouz Coffee shop — or an
  Azouz counter..." lost its em dash to a comma, which is what copy.test.js
  asks of every string a customer reads. And "Tell us your: City · Location ·
  Space Size · Business Type" became a sentence, because the four items are now
  the four fields of the form directly below it.
*/
test('the coffee shop page carries every section the client wrote', async () => {
  await expectAll('page.own-an-azouz-coffee.json', [
    'Bring Azouz Coffee to Your Area.',
    'Open your own Azouz Coffee location with the coffee, equipment, branding, menu and support already built around you.',
    'Whether you want a complete coffee shop or a smaller Azouz Coffee corner inside an existing business, we help you get from location to opening.',
    'A Coffee Business Without Starting From Zero.',
    'Opening a coffee shop involves more than finding a location.',
    'You need the right coffee, equipment, menu, branding, training and reliable supply.',
    'With Azouz Coffee, the system is already there.',
    'You focus on your location and your customers. We support the coffee operation behind it.',
    'Two Ways to Open.',
    'What You Get.',
    'Powered by Our Own Roastery.',
    'Built to Make Opening Simpler.',
    'Put Azouz Coffee in Your Neighbourhood.',
  ]);
});

test('the coffee shop page describes both formats the client named', async () => {
  await expectAll('page.own-an-azouz-coffee.json', [
    'Full Azouz Coffee Location',
    'Open a complete Azouz Coffee shop using our brand, coffee, menu and operating model.',
    'Ideal for entrepreneurs looking to operate their own branded coffee business.',
    'Azouz Coffee Corner',
    'Add an Azouz Coffee counter inside a business you already operate.',
    'Suitable for:',
    'Hotels', 'Restaurants', 'Offices', 'Retail Spaces', 'Universities', 'Commercial Buildings',
    'A simpler way to introduce a premium coffee offer without opening a full standalone café.',
  ]);
});

test('the coffee shop page lists all six things a location gets', async () => {
  await expectAll('page.own-an-azouz-coffee.json', [
    'Coffee Supply', 'Espresso, Turkish, filter and specialty coffee roasted by our own roastery.',
    'Equipment', 'Coffee machine, grinder and brewing equipment selected around your expected volume.',
    'Azouz Branding', 'Brand identity, packaging and signage for your location.',
    'Menu Development', 'A proven drinks menu with recipes and pricing guidance.',
    'Barista Training', 'Training on coffee preparation, equipment and drink consistency.',
    'Opening & Operational Support', 'Support with setup, ordering and the day-to-day coffee operation.',
  ]);
});

test('the coffee shop page keeps the roastery argument and all four things an owner is spared', async () => {
  await expectAll('page.own-an-azouz-coffee.json', [
    "Your coffee isn't coming from an outside supplier.",
    'We roast it ourselves.',
    'That gives your location direct access to coffee sourcing, custom roasting, blending and ongoing supply from the same team supporting the brand.',
    'It means fewer suppliers and greater consistency in the cup.',
    "You don't need to develop your own coffee brand.",
    "You don't need to build your own roasting operation.",
    "You don't need to create a menu from scratch.",
    "You don't need to figure out the coffee equipment alone.",
    'We have already done the coffee work. You build the business around it.',
  ]);
});

test('the coffee shop page asks for the four details the client needs, under every action they wrote', async () => {
  await expectAll('page.own-an-azouz-coffee.json', [
    'Imagine your own Azouz Coffee shop, or an Azouz counter operating inside a business you already own.',
    "we'll explain which Azouz Coffee format could work for you.",
    'City', 'Location', 'Space size', 'Business type',
    'Start Your Azouz Coffee', 'Request Information',
    'Enquire About a Location', 'Enquire About a Coffee Corner',
    'Start My Azouz Coffee', 'Request More Information',
  ]);
});

test('our brands carries the roastery line the client wrote', async () => {
  await expectAll('page.our-brands.json', [
    'Small-batch roasting, and a big, bold flavour.',
    'Fresh, ethically sourced coffee from bean to brew, delivered straight to your door.',
  ]);
});

test('our brands lists all eight retail formats the client named', async () => {
  await expectAll('page.our-brands.json', [
    'Espresso coffee', 'Turkish coffee', 'Specialty coffee', 'Single-origin coffee',
    'Whole bean coffee', 'Ground coffee', 'Retail coffee bags', 'Selected seasonal products',
  ]);
});
