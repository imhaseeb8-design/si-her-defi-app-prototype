// Screenshots the React prototype in the same states as the live capture, for side-by-side review.
// Usage: node proto.js <out-dir> [name-filter]   (prototype must be running on :3120)
const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer-core');
const { CHROME } = require('./common');

const BASE = process.env.PROTO_BASE || 'http://localhost:3120/siherdefi';
const [OUT, only] = process.argv.slice(2);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const DESKTOP = { width: 1440, height: 900 };
const MOBILE = { width: 390, height: 844, isMobile: true, hasTouch: true, deviceScaleFactor: 2 };

function helpers(page) {
  const h = {
    page, sleep,
    goto: async (p) => { await page.goto(BASE + p, { waitUntil: 'networkidle2' }); await sleep(900); },
    setup: async (preset, flags = {}, patch) => {
      await page.goto(BASE + '/login', { waitUntil: 'networkidle2' });
      await page.waitForFunction(() => !!window.__demo, { timeout: 30000 });
      await page.evaluate((preset, flags, patch) => {
        localStorage.setItem('siherdefi_demo_hidden', '1');
        window.__demo.applyPreset(preset);
        window.__demo.setState((s) => { Object.assign(s.flags, { latency: 150 }, flags); if (patch) new Function('s', patch)(s); });
      }, preset, flags, patch || null);
    },
    click: async (text, sel = 'button, a, [role=button], [role=radio], label') => {
      const ok = await page.evaluate((text, sel) => {
        const els = [...document.querySelectorAll(sel)].filter((e) => e.offsetParent !== null || e.getClientRects().length);
        const el = els.find((e) => e.innerText?.trim() === text) || els.find((e) => e.getAttribute('aria-label') === text) || els.find((e) => e.innerText?.includes(text));
        if (!el) return false; el.scrollIntoView({ block: 'center' }); el.click(); return true;
      }, text, sel);
      if (!ok) console.warn(`  ! no element "${text}"`);
      await sleep(700); return ok;
    },
    type: async (sel, v) => { await page.waitForSelector(sel); await page.click(sel); await page.type(sel, v, { delay: 5 }); await sleep(200); },
    shot: async (name, { full = true } = {}) => {
      await sleep(500);
      const vp = page.viewport();
      if (full) {
        const extra = await page.evaluate(() => Math.max(0, ...[...document.querySelectorAll('*')].map((e) => {
          const cs = getComputedStyle(e); return /(auto|scroll)/.test(cs.overflowY) && e.clientHeight > 200 ? e.scrollHeight - e.clientHeight : 0;
        })));
        if (extra > 0) { await page.setViewport({ ...vp, height: vp.height + extra }); await sleep(400); }
      }
      await page.screenshot({ path: path.join(OUT, `${name}.png`), fullPage: full });
      if (page.viewport().height !== vp.height) await page.setViewport(vp);
      console.log(`  ✓ ${name}`);
    },
  };
  return h;
}

const S = (name, steps, opts = {}) => ({ name, steps, ...opts });
const scenarios = [
  S('A-signin', async (h) => {
    await h.setup('new'); await h.goto('/login'); await h.shot('A01-signin-email-empty');
    await h.type('input[type=email]', 'ada@example.com'); await h.shot('A02-signin-email-filled');
    await h.click('Send my code'); await sleep(1200); await h.shot('A03-signin-code-empty');
    await h.page.click('input[autocomplete=one-time-code]'); await h.page.keyboard.type('482913', { delay: 40 }); await h.shot('A05-signin-code-filled');
    await h.click('Verify email'); await sleep(1500); await h.shot('A06-signin-verified');
    await h.click('Continue'); await sleep(1500); await h.shot('B01-profile-prefilled');
  }),
  S('A-errors', async (h) => {
    await h.setup('new', { emailNotFound: true }); await h.goto('/login'); await h.type('input[type=email]', 'someone@example.com'); await h.click('Send my code'); await sleep(800); await h.shot('A07-signin-email-not-found');
    await h.setup('new', { wrongCode: true }); await h.goto('/verify?email=ada%40example.com'); await h.page.click('input[autocomplete=one-time-code]'); await h.page.keyboard.type('111111', { delay: 30 }); await h.click('Verify email'); await sleep(800); await h.shot('A09-signin-code-wrong');
  }),
  S('B-profile', async (h) => {
    await h.setup('verified'); await h.goto('/profile'); await sleep(800);
    const f = await h.page.$('input[type=file]'); await f.uploadFile(path.join(__dirname, 'sample-avatar.png')); await sleep(800); await h.shot('B03-profile-photo-added');
    await h.setup('wallet'); await h.goto('/profile?from=dashboard'); await h.shot('B06-profile-edit-from-dashboard');
  }),
  S('C-wallet', async (h) => {
    await h.setup('profile', { walletMode: 'none' }); await h.goto('/wallet'); await h.shot('C01-wallet-not-connected');
    await h.setup('profile', { walletMode: 'metamask' }); await h.goto('/wallet'); await h.shot('C02-wallet-metamask-detected');
    await h.click('MetaMask'); await sleep(500); await h.shot('C03-wallet-connecting');
    await sleep(1600); await h.shot('C04-wallet-signing'); await sleep(2600); await h.shot('C05-wallet-connected');
    await h.setup('profile', { walletMode: 'wrong-network' }); await h.goto('/wallet'); await h.click('MetaMask'); await sleep(2200); await h.shot('C06-wallet-wrong-network', { full: false });
    await h.setup('profile', { walletMode: 'reject-connect' }); await h.goto('/wallet'); await h.click('MetaMask'); await sleep(2200); await h.shot('C08-wallet-rejected-connect');
    await h.setup('profile', { walletMode: 'reject-sign' }); await h.goto('/wallet'); await h.click('MetaMask'); await sleep(4300); await h.shot('C09-wallet-rejected-sign');
    await h.setup('profile'); await h.goto('/wallet'); await h.click('WalletConnect'); await sleep(800); await h.shot('C10-wallet-walletconnect-qr', { full: false });
  }),
  S('D-dashboard', async (h) => {
    await h.setup('wallet'); await h.goto('/dashboard'); await sleep(800); await h.shot('D01-dashboard-new-user');
    await h.setup('part1-done'); await h.goto('/dashboard'); await sleep(800); await h.shot('D02-dashboard-part1-done');
    await h.setup('part1-draft'); await h.goto('/dashboard'); await sleep(800); await h.shot('D03-dashboard-part1-in-progress');
    await h.setup('part1-done'); await h.goto('/dashboard'); await sleep(800); await h.click('Add to calendar'); await h.shot('D04-dashboard-add-to-calendar', { full: false }); await h.page.keyboard.press('Escape');
    await h.page.click('[aria-label="Account options"]'); await sleep(500); await h.shot('D05-dashboard-user-menu', { full: false });
    await h.setup('badge'); await h.goto('/dashboard'); await sleep(800); await h.shot('D07-dashboard-badge-earned');
  }),
  S('E-onboard', async (h) => {
    await h.setup('wallet'); await h.goto('/onboard'); await sleep(800); await h.shot('E01-onboard-start');
    await h.click('I’ve watched it ✓'); await h.shot('E02-onboard-video-watched');
    for (let i = 0; i < 2; i++) { await h.page.evaluate(() => [...document.querySelectorAll('a')].find((a) => a.innerText.trim() === 'Follow ↗')?.click()); await sleep(700); }
    for (const p of await h.page.browserContext().pages()) if (p !== h.page) await p.close();
    await h.shot('E04-onboard-followed-both');
    await h.click('Continue to questions'); await sleep(600); await h.shot('E05-onboard-questions-empty', { full: false });
    const answers = ['I use a mobile money wallet daily and bought some USDC once, but I have never used a DeFi protocol.', 'A friend recommended it.', 'A savings circle on Base.', 'I learn best with real examples and short exercises.'];
    for (let i = 0; i < 4; i++) {
      await h.page.type('textarea', answers[i], { delay: 1 });
      if (i === 0) await h.shot('E07-onboard-q1-answered', { full: false });
      if (i === 3) await h.shot('E13-onboard-q4-answered', { full: false });
      await h.click(i === 3 ? 'Submit' : 'Next', 'button'); await sleep(700);
    }
    await h.shot('E14-onboard-after-q4', { full: false });
  }),
  S('F-module', async (h) => {
    await h.setup('part1-done'); await h.goto('/module/si-her-collective-capital'); await sleep(800); await h.shot('F01-module-week1');
    await h.click('Start quiz →'); await h.shot('F02-quiz-start', { full: false });
    await h.click('Members pool resources', '[role=radio]'); await sleep(400); await h.shot('F03-quiz-pass-q1-answered', { full: false });
    await h.click('Next question →'); await h.click('To make funding decisions transparent', '[role=radio]'); await h.click('Next question →');
    await h.click('Who contributes, who decides', '[role=radio]'); await sleep(600); await h.shot('F03-quiz-pass-result', { full: false });
    await h.click('Back to module'); await sleep(800); await h.shot('F04-module-week1-passed');
    await h.setup('part1-done', { quizMode: 'fail' }); await h.goto('/module/si-her-collective-capital'); await h.click('Start quiz →');
    await h.click('Members pool resources', '[role=radio]'); await h.click('Next question →'); await h.click('To make funding decisions transparent', '[role=radio]'); await sleep(400); await h.shot('F05-quiz-fail-q2-answered', { full: false });
    await h.click('Next question →'); await h.click('Who contributes, who decides', '[role=radio]'); await sleep(600); await h.shot('F05-quiz-fail-result', { full: false });
    await h.click('← Back to module'); await sleep(800); await h.shot('F06-module-week1-retry-later');
    await h.goto('/module/token-fundamentals'); await sleep(800); await h.shot('F07-module-upcoming');
    await h.setup('part1-done', { quizMode: 'fail' }, "s.quizzes['si-her-collective-capital']={attemptsUsed:2,passed:false,answers:[],lastResult:null,retryAvailableAt:null}");
    await h.goto('/module/si-her-collective-capital'); await h.click('Start quiz →');
    await h.click('Members pool resources', '[role=radio]'); await h.click('Next question →'); await h.click('To make funding decisions transparent', '[role=radio]'); await h.click('Next question →'); await h.click('Who contributes, who decides', '[role=radio]'); await sleep(600);
    await h.shot('F08-quiz-fail-last-result', { full: false });
    await h.click('← Back to module'); await sleep(800); await h.shot('F09-module-week1-locked-24h');
  }),
  S('G-certificate', async (h) => {
    await h.setup('part1-done'); await h.goto('/certificate'); await sleep(800); await h.shot('G01-certificate-locked');
    await h.setup('badge'); await h.goto('/certificate'); await sleep(800); await h.shot('G02-certificate-earned');
    await h.setup('minted'); await h.goto('/certificate'); await sleep(800); await h.shot('G03-certificate-minted');
  }),
  S('H-settings', async (h) => {
    await h.setup('part1-done'); await h.goto('/settings'); await sleep(800); await h.shot('H01-settings');
    await h.click('Disconnect'); await sleep(800); await h.shot('H02-settings-wallet-disconnected', { full: false });
  }),
  S('M-mobile', async (h) => {
    await h.setup('new'); await h.goto('/login'); await h.shot('M01-signin-email');
    await h.setup('verified'); await h.goto('/profile'); await sleep(600); await h.shot('M04-profile');
    await h.setup('profile'); await h.goto('/wallet'); await h.shot('M05-wallet');
    await h.setup('wallet'); await h.goto('/dashboard'); await sleep(800); await h.shot('M07-dashboard-new-user');
    await h.page.click('[aria-label="Open mobile menu"]'); await sleep(500); await h.shot('M08-mobile-menu', { full: false });
    await h.goto('/onboard'); await sleep(600); await h.shot('M09-onboard');
    await h.setup('part1-done'); await h.goto('/dashboard'); await sleep(800); await h.shot('M11-dashboard-active');
    await h.goto('/module/si-her-collective-capital'); await sleep(800); await h.shot('M12-module');
    await h.goto('/certificate'); await sleep(800); await h.shot('M14-certificate');
    await h.goto('/settings'); await sleep(800); await h.shot('M15-settings');
  }, { viewport: MOBILE }),
];

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: true });
  for (const s of scenarios) {
    if (only && !s.name.includes(only)) continue;
    console.log(`▶ ${s.name}`);
    const ctx = await browser.createBrowserContext();
    const page = await ctx.newPage();
    page.on('pageerror', (e) => console.log(`  [pageerror] ${e.message}`));
    page.on('console', (m) => { if (m.type() === 'error') console.log(`  [console] ${m.text().slice(0, 200)}`); });
    await page.setViewport(s.viewport || DESKTOP);
    try { await s.steps(helpers(page)); } catch (e) { console.log(`  ✗ ${e.message}`); }
    await ctx.close();
  }
  await browser.close();
})();
