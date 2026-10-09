// Side-by-side sheet: live capture (left) vs prototype (right). node compare.js <proto-dir> <out.jpg> <prefix...>
const fs = require('fs'); const path = require('path'); const puppeteer = require('puppeteer-core'); const { CHROME } = require('./common');
const LIVE = path.resolve(__dirname, '../../capture/shots');
const [PROTO, out, ...prefixes] = process.argv.slice(2);
const names = fs.readdirSync(PROTO).filter((f) => f.endsWith('.png') && prefixes.some((p) => f.startsWith(p))).sort();
const b64 = (p) => fs.existsSync(p) ? `data:image/png;base64,${fs.readFileSync(p).toString('base64')}` : '';
(async () => {
  const b = await puppeteer.launch({ executablePath: CHROME, headless: true }); const p = await b.newPage();
  await p.setViewport({ width: 1600, height: 800 });
  const rows = names.map((f) => `<h3>${f.replace('.png', '')}</h3><div class=row><img src="${b64(path.join(LIVE, f))}"><img src="${b64(path.join(PROTO, f))}"></div>`).join('');
  await p.setContent(`<style>body{margin:8px;font:600 14px system-ui}h3{margin:10px 0 4px}.row{display:grid;grid-template-columns:1fr 1fr;gap:8px;align-items:start}img{width:100%;max-height:${process.env.MAXH || 700}px;object-fit:cover;object-position:top;border:1px solid #bbb}</style>${rows}`, { waitUntil: 'load' });
  await p.screenshot({ path: out, fullPage: true, type: 'jpeg', quality: 62 }); await b.close(); console.log(names.length, 'pairs');
})();
