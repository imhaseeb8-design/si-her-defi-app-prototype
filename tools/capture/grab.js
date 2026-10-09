// Saves the app's JS chunks (to scratch, for reading component logic) and real GET responses (fixtures).
const fs = require('fs'); const path = require('path');
const { launch, BASE, API } = require('./common');
const JS = process.argv[2]; const FIX = path.resolve(__dirname, 'fixtures-raw');
fs.mkdirSync(JS, { recursive: true }); fs.mkdirSync(FIX, { recursive: true });
(async () => {
  const b = await launch(true); const p = await b.newPage();
  await p.setRequestInterception(true);
  p.on('request', r => (r.url().startsWith(API) && !['GET', 'OPTIONS'].includes(r.method())) ? r.respond({ status: 200, contentType: 'application/json', body: '{"success":true,"data":{}}' }) : r.continue());
  p.on('response', async r => { const u = r.url();
    try { if (u.includes('/_next/') && u.endsWith('.js')) fs.writeFileSync(path.join(JS, u.split('/').pop()), await r.text());
      if (u.startsWith(API) && r.request().method() === 'GET') fs.writeFileSync(path.join(FIX, u.slice(API.length).replace(/[\/?=&]/g, '_') + '.json'), await r.text()); } catch {} });
  for (const r of ['/module/si-her-collective-capital', '/module/test-live-session', '/dashboard', '/onboard', '/certificate', '/settings', '/profile', '/wallet', '/login', '/']) { await p.goto(BASE + r, { waitUntil: 'networkidle2' }); await new Promise(x => setTimeout(x, 1500)); }
  const tok = await p.evaluate(() => localStorage.getItem('siherdefi_auth_token'));
  const extra = ['/quiz/si-her-collective-capital', '/modules/si-her-collective-capital', '/modules/test-live-session', '/modules', '/modules/cms/speakers', '/partners', '/partners/more-ways', '/badges', '/certificate', '/onboard/part1', '/onboard/status', '/wallet/status', '/profile/prefill', '/auth/me', '/settings'];
  for (const e of extra) { const t = await p.evaluate(async (u, t) => { const r = await fetch(u, { headers: { Authorization: 'Bearer ' + t } }); return r.status + '\n' + await r.text(); }, API + e, tok); fs.writeFileSync(path.join(FIX, e.replace(/\//g, '_') + '.json'), t.slice(t.indexOf('\n') + 1)); }
  await b.close(); console.log('ok');
})();
