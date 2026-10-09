// Captures screens of the live app.
//  - Default: uses the signed-in profile (see login.js). Every API write is blocked and faked.
//  - Scenario with `world`: runs in a clean signed-out browser where the whole API is answered by
//    world.js (a fake new applicant). Nothing reaches the real server.
//
// Usage: node capture.js scenarios/<file>.js [only-scenario-name-substring]
const fs = require('fs');
const path = require('path');
const { launch, BASE, API } = require('./common');
const { createWorld } = require('./world');

const OUT = path.resolve(__dirname, '../../capture');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const DESKTOP = { width: 1440, height: 900 };

async function preparePage(page, ctx) {
  await page.setRequestInterception(true);
  page.on('request', async (req) => {
    const url = req.url();
    if (!url.startsWith(API) || req.method() === 'OPTIONS') return req.continue();
    const p = url.slice(API.length).split('?')[0];
    const method = req.method();
    let body;
    try { body = req.postData() ? JSON.parse(req.postData()) : undefined; } catch { body = req.postData(); }
    let res = ctx.mocks?.[`${method} ${p}`];
    if (typeof res === 'function') res = await res(body);
    if (res === undefined && ctx.world) res = ctx.world.handle(method, p, body);
    if (res === undefined && method !== 'GET') res = { success: true, message: 'mocked', data: {} };
    ctx.log.push({ call: `${method} ${p}`, body: typeof body === 'object' ? JSON.stringify(body)?.slice(0, 300) : body, mocked: res !== undefined });
    if (res === undefined) return req.continue();
    const { __status: status = 200, ...json } = res;
    if (ctx.delay) await sleep(ctx.delay);
    req.respond({ status, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify(json) });
  });
}

function helpers(page, ctx) {
  const h = {
    page, sleep, ctx,
    goto: async (p) => { await page.goto(BASE + p, { waitUntil: 'networkidle2', timeout: 60000 }); await sleep(900); },
    url: () => page.url().replace(BASE, ''),
    find: (text, sel) => page.evaluateHandle((text, sel) => {
      const els = [...document.querySelectorAll(sel)].filter((e) => e.offsetParent !== null || e.getClientRects().length);
      return els.find((e) => e.innerText?.trim() === text) || els.find((e) => e.getAttribute('aria-label') === text) || els.find((e) => e.innerText?.includes(text)) || null;
    }, text, sel || 'button, a, [role=button], label, [role=tab], [role=radio], [role=option], [role=checkbox], [role=switch]'),
    click: async (text, sel) => {
      const el = (await h.find(text, sel)).asElement();
      if (!el) { console.warn(`  ! no element "${text}"`); return false; }
      await el.evaluate((e) => e.scrollIntoView({ block: 'center' }));
      await el.click().catch(async () => el.evaluate((e) => e.click()));
      await sleep(800); return true;
    },
    type: async (selector, value, { clear = true } = {}) => {
      await page.waitForSelector(selector, { visible: true, timeout: 8000 });
      if (clear) await page.$eval(selector, (e) => { e.focus(); e.select?.(); });
      await page.type(selector, value, { delay: 8 }); await sleep(250);
    },
    // Full-height screenshot that also unrolls inner scroll panels (h-screen layouts).
    shot: async (name, { full = true } = {}) => {
      for (const d of ['shots', 'html', 'text']) fs.mkdirSync(`${OUT}/${d}`, { recursive: true });
      await sleep(600);
      const vp = page.viewport();
      if (full) {
        const extra = await page.evaluate(() => Math.max(0, ...[...document.querySelectorAll('*')].map((e) => {
          const cs = getComputedStyle(e);
          return /(auto|scroll)/.test(cs.overflowY) && e.clientHeight > 200 ? e.scrollHeight - e.clientHeight : 0;
        })));
        if (extra > 0) { await page.setViewport({ ...vp, height: vp.height + extra }); await sleep(500); }
      }
      await page.screenshot({ path: `${OUT}/shots/${name}.png`, fullPage: full });
      if (page.viewport().height !== vp.height) await page.setViewport(vp);
      const html = await page.content();
      fs.writeFileSync(`${OUT}/html/${name}.html`, `<!-- ${page.url()} -->\n` + html.replace('<head>', '<head><base href="https://certifications.si3.space/">'));
      fs.writeFileSync(`${OUT}/text/${name}.txt`, `${page.url()}\n\n` + await page.evaluate(() => document.body.innerText));
      console.log(`  ✓ ${name}  (${h.url()})`);
    },
  };
  return h;
}

async function run(scenarios, only) {
  const browser = await launch(true);
  const log = [];
  for (const s of scenarios) {
    if (only && !s.name.includes(only)) continue;
    console.log(`▶ ${s.name}`);
    const ctx = { log, mocks: s.mocks, delay: s.delay };
    let context;
    let page;
    if (s.world) {
      context = await browser.createBrowserContext();
      page = await context.newPage();
      ctx.world = createWorld(typeof s.world === 'object' ? s.world : {});
      if (ctx.world.state.signedIn) {
        await page.evaluateOnNewDocument((u) => {
          if (!localStorage.getItem('siherdefi_auth_token')) {
            localStorage.setItem('siherdefi_auth_token', 'demo-token');
            localStorage.setItem('siherdefi_auth_user', JSON.stringify(u));
          }
          document.cookie = 'siherdefi_token=demo-token; path=/; SameSite=Lax';
        }, ctx.world.state.user);
      }
    } else {
      page = await browser.newPage();
    }
    if (s.wallet) await page.evaluateOnNewDocument(require('./fake-wallet'), s.wallet === true ? {} : s.wallet);
    await page.setViewport(s.viewport || DESKTOP);
    await preparePage(page, ctx);
    const h = helpers(page, ctx);
    try { await s.steps(h); } catch (e) { console.error(`  ✗ ${e.message}`); await h.shot(`${s.name}--error`).catch(() => {}); }
    if (context) await context.close(); else await page.close();
  }
  fs.mkdirSync(`${OUT}/api`, { recursive: true });
  fs.writeFileSync(`${OUT}/api/calls-${path.basename(process.argv[2], '.js')}.json`, JSON.stringify(log, null, 2));
  await browser.close();
}

run(require(path.resolve(process.argv[2])), process.argv[3]);
