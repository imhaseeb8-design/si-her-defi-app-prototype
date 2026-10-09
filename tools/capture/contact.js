// Renders a contact sheet of captured screens: node contact.js <out.jpg> <glob-prefix...>
const fs = require('fs'); const path = require('path'); const puppeteer = require('puppeteer-core'); const { CHROME } = require('./common');
const SHOTS = path.resolve(__dirname, '../../capture/shots');
const [out, ...prefixes] = process.argv.slice(2);
const files = fs.readdirSync(SHOTS).filter((f) => f.endsWith('.png') && prefixes.some((p) => f.startsWith(p))).sort();
(async () => {
  const b = await puppeteer.launch({ executablePath: CHROME, headless: true }); const p = await b.newPage();
  await p.setViewport({ width: 1800, height: 800 });
  const cells = files.map((f) => `<figure><img src="data:image/png;base64,${fs.readFileSync(path.join(SHOTS, f)).toString('base64')}"><figcaption>${f.replace('.png', '')}</figcaption></figure>`).join('');
  await p.setContent(`<style>body{--cols:${process.env.COLS||3};margin:8px;font:600 15px system-ui;display:grid;grid-template-columns:repeat(var(--cols,3),1fr);gap:10px;align-items:start}figure{margin:0}img{width:100%;max-height:520px;object-fit:cover;object-position:top;border:1px solid #ccc}figcaption{padding:3px 0}</style>${cells}`, { waitUntil: 'load' });
  await p.screenshot({ path: out, fullPage: true, type: 'jpeg', quality: 70 }); await b.close(); console.log(files.length, 'screens');
})();
