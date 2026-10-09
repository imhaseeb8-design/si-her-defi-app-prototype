// Converts a captured page (capture/html/<name>.html) into compact JSX, used as the starting point
// for rebuilding each screen as a React component.
// Usage: node convert.js <capture-name> [css-selector-to-start-from] > out.jsx
const fs = require('fs');
const path = require('path');
const { parse } = require('node-html-parser');

const [name, selector] = process.argv.slice(2);
const html = fs.readFileSync(path.resolve(__dirname, '../../capture/html', `${name}.html`), 'utf8');
const root = parse(html, { comment: false, blockTextElements: { script: false, style: false, noscript: false } });
let start = selector ? root.querySelector(selector) : root.querySelector('body');

const VOID = new Set(['img', 'input', 'br', 'hr', 'meta', 'link', 'source', 'area', 'col', 'wbr', 'path', 'circle', 'rect', 'line', 'polyline', 'polygon', 'ellipse', 'stop', 'use']);
const DROP = new Set(['script', 'style', 'noscript', 'template', 'link', 'next-route-announcer', 'w3m-modal', 'appkit-modal', 'wcm-modal', 'nextjs-portal']);
const RENAME = { class: 'className', for: 'htmlFor', tabindex: 'tabIndex', autocomplete: 'autoComplete', maxlength: 'maxLength', minlength: 'minLength', readonly: 'readOnly', inputmode: 'inputMode', srcset: 'srcSet', crossorigin: 'crossOrigin', fetchpriority: 'fetchPriority', viewbox: 'viewBox', 'xlink:href': 'xlinkHref', 'xmlns:xlink': 'xmlnsXlink', autofocus: 'autoFocus', enterkeyhint: 'enterKeyHint', allowfullscreen: 'allowFullScreen', frameborder: 'frameBorder', playsinline: 'playsInline', colspan: 'colSpan', rowspan: 'rowSpan', datetime: 'dateTime', spellcheck: 'spellCheck', novalidate: 'noValidate' };
const camel = (s) => s.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
const esc = (s) => s.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
const decode = (s) => s.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#x27;|&#39;/g, "'").replace(/&nbsp;/g, ' ');

function img(src) {
  const m = src.match(/_next\/image\?url=([^&]+)/);
  if (m) src = decodeURIComponent(m[1]);
  return src.replace(/^https:\/\/certifications\.si3\.space/, '');
}

function attrs(el) {
  const out = [];
  for (const [k0, v0] of Object.entries(el.rawAttributes)) {
    const k = k0.toLowerCase();
    let v = decode(v0 ?? '');
    if (['srcset', 'sizes', 'data-nimg', 'decoding', 'fetchpriority', 'data-precedence', 'nonce'].includes(k)) continue;
    if (k.startsWith('on')) continue;
    if (k === 'style') {
      const obj = v.split(';').map((d) => d.trim()).filter(Boolean).map((d) => {
        const i = d.indexOf(':'); const p = d.slice(0, i).trim(); const val = d.slice(i + 1).trim();
        return `${p.startsWith('--') ? `"${p}"` : camel(p)}:"${esc(val)}"`;
      });
      out.push(`style={{${obj.join(',')}}}`); continue;
    }
    if (k === 'src' || k === 'href' || k === 'poster') v = img(v);
    let key = RENAME[k] || (k.startsWith('data-') || k.startsWith('aria-') ? k : (k.includes('-') || k.includes(':') ? camel(k.replace(':', '-')) : k0));
    if (el.rawTagName === 'input' && k === 'value') key = 'defaultValue';
    if (el.rawTagName === 'input' && k === 'checked') { out.push('defaultChecked'); continue; }
    if (['disabled', 'required', 'hidden', 'multiple', 'selected', 'autofocus', 'readonly', 'playsinline', 'allowfullscreen', 'muted', 'loop', 'autoplay', 'controls', 'novalidate'].includes(k) && (v === '' || v === k)) { out.push(key); continue; }
    out.push(`${key}="${esc(v)}"`);
  }
  return out.length ? ' ' + out.join(' ') : '';
}

function text(t) {
  const s = decode(t).replace(/\s+/g, ' ');
  if (!s.trim()) return s === ' ' ? ' ' : '';
  return /[{}<>]/.test(s) ? `{${JSON.stringify(s)}}` : s;
}

function walk(node, depth) {
  if (node.nodeType === 3) return text(node.rawText);
  if (node.nodeType !== 1) return '';
  const tag = node.rawTagName;
  if (!tag || DROP.has(tag.toLowerCase())) return '';
  if (node.getAttribute('hidden') !== undefined && tag === 'div' && !node.childNodes.length) return '';
  const pad = ' '.repeat(depth);
  const kids = node.childNodes.map((c) => walk(c, depth + 1)).join('');
  const a = attrs(node);
  if (VOID.has(tag.toLowerCase()) && !kids.trim()) return `\n${pad}<${tag}${a}/>`;
  const inner = kids.includes('\n') ? `${kids}\n${pad}` : kids.trim();
  return `\n${pad}<${tag}${a}>${inner}</${tag}>`;
}

if (!start) { console.error('selector not found'); process.exit(1); }
process.stdout.write(walk(start, 0).trim() + '\n');
