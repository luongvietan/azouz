import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { extractSchema, defaultSettings, defaultBlocks } from '../../scripts/schema-parser.js';

/**
 * Consume raw tokens until the matching end tag, returning their source text.
 * Used for tags whose bodies are not Liquid (schema JSON, stylesheet, javascript).
 */
function consumeRaw(remainTokens, endTagName) {
  let raw = '';
  let token;
  while ((token = remainTokens.shift())) {
    if (token.name === endTagName) return raw;
    raw += typeof token.getText === 'function' ? token.getText() : (token.raw ?? '');
  }
  throw new Error(`Missing {% ${endTagName} %}`);
}

/** A tag that swallows a raw body and emits nothing. */
function rawSwallowTag(endTagName) {
  return {
    parse(tagToken, remainTokens) {
      this.body = consumeRaw(remainTokens, endTagName);
    },
    render() {
      return '';
    },
  };
}

export function registerShopifyTags(engine, options = {}) {
  const { sectionsDir = null, sectionOverrides = {} } = options;

  engine.registerTag('schema', rawSwallowTag('endschema'));
  engine.registerTag('stylesheet', rawSwallowTag('endstylesheet'));
  engine.registerTag('javascript', rawSwallowTag('endjavascript'));

  // {% style %} bodies ARE Liquid — they interpolate section settings.
  engine.registerTag('style', {
    parse(tagToken, remainTokens) {
      this.templates = [];
      const stream = engine.parser
        .parseStream(remainTokens)
        .on('template', (tpl) => this.templates.push(tpl))
        .on('tag:endstyle', function () {
          this.stop();
        })
        .on('end', () => {
          throw new Error('Missing {% endstyle %}');
        });
      stream.start();
    },
    *render(ctx, emitter) {
      emitter.write('<style>');
      yield engine.renderer.renderTemplates(this.templates, ctx, emitter);
      emitter.write('</style>');
    },
  });

  engine.registerTag('form', {
    parse(tagToken, remainTokens) {
      this.args = tagToken.args;
      this.templates = [];
      const stream = engine.parser
        .parseStream(remainTokens)
        .on('template', (tpl) => this.templates.push(tpl))
        .on('tag:endform', function () {
          this.stop();
        })
        .on('end', () => {
          throw new Error('Missing {% endform %}');
        });
      stream.start();
    },
    *render(ctx, emitter) {
      const formType = (this.args.match(/'([^']+)'|"([^"]+)"/) || [])[1] ?? 'contact';
      emitter.write(
        `<form method="post" action="/${formType}#${formType}" accept-charset="UTF-8"` +
          ` class="${formType}-form">` +
          `<input type="hidden" name="form_type" value="${formType}">` +
          `<input type="hidden" name="utf8" value="✓">`,
      );
      ctx.push({ form: { posted_successfully: false, errors: null } });
      yield engine.renderer.renderTemplates(this.templates, ctx, emitter);
      ctx.pop();
      emitter.write('</form>');
    },
  });

  engine.registerTag('paginate', {
    parse(tagToken, remainTokens) {
      // e.g. "collection.products by 12"
      const match = /^(.+?)\s+by\s+(\d+)\s*$/.exec(tagToken.args.trim());
      this.collectionExpression = match ? match[1].trim() : tagToken.args.trim();
      this.pageSize = match ? Number(match[2]) : 20;
      this.templates = [];
      const stream = engine.parser
        .parseStream(remainTokens)
        .on('template', (tpl) => this.templates.push(tpl))
        .on('tag:endpaginate', function () {
          this.stop();
        })
        .on('end', () => {
          throw new Error('Missing {% endpaginate %}');
        });
      stream.start();
    },
    *render(ctx, emitter) {
      // evalValue() returns a Promise and is empty under parseAndRenderSync;
      // _evalValue is the generator LiquidJS 10 uses for both sync and async.
      const collection = yield engine._evalValue(this.collectionExpression, ctx);
      const items = Array.isArray(collection) ? collection : (collection?.products ?? []);
      const pages = Math.max(1, Math.ceil(items.length / this.pageSize));
      ctx.push({
        paginate: {
          items: items.length,
          current_page: 1,
          current_offset: 0,
          page_size: this.pageSize,
          pages,
          parts: [],
          next: pages > 1 ? { title: 'Next', url: '?page=2', is_link: true } : null,
          previous: null,
        },
      });
      yield engine.renderer.renderTemplates(this.templates, ctx, emitter);
      ctx.pop();
    },
  });

  engine.registerTag('section', {
    parse(tagToken) {
      this.args = tagToken.args;
    },
    *render(ctx, emitter) {
      const name = (this.args.match(/'([^']+)'|"([^"]+)"/) || [])[1];
      if (!name) return;
      if (!sectionsDir) {
        emitter.write(`<!-- section: ${name} -->`);
        return;
      }
      const file = join(sectionsDir, `${name}.liquid`);
      if (!existsSync(file)) {
        emitter.write(`<!-- missing section: ${name} -->`);
        return;
      }
      const source = readFileSync(file, 'utf8');
      const schema = extractSchema(source, `sections/${name}.liquid`);
      const override = sectionOverrides[name] ?? {};
      ctx.push({
        section: {
          id: name,
          settings: { ...defaultSettings(schema), ...(override.settings ?? {}) },
          blocks: override.blocks ?? defaultBlocks(schema),
          shopify_attributes: '',
        },
      });
      const templates = engine.parse(source, file);
      yield engine.renderer.renderTemplates(templates, ctx, emitter);
      ctx.pop();
    },
  });

  // {% sections 'group' %} — section groups are not modelled in preview.
  engine.registerTag('sections', {
    parse(tagToken) {
      this.args = tagToken.args;
    },
    render() {
      return '';
    },
  });
}
