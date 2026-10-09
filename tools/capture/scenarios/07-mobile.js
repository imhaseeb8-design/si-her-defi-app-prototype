// Phone-width (390×844) captures of every key screen. Simulated API.
const profile = { name: 'Ada Nwosu', role: 'Product designer', organization: 'Lagos Fintech Collective', socialLink: 'https://linkedin.com/in/adanwosu', bio: 'Designing savings tools for market traders in Lagos.', photoUrl: '' };
const me = { signedIn: true, connected: true, profile };
const done = { ...me, progress: { status: 'completed', videoWatched: true, followedSocialIds: ['onboarding-social-x', 'onboarding-social-linkedin'], answers: {}, completedAt: '2026-10-08T18:00:00Z' } };
const viewport = { width: 390, height: 844, isMobile: true, hasTouch: true, deviceScaleFactor: 2 };
const s = (name, world, steps, extra = {}) => ({ name, world, viewport, steps, ...extra });
module.exports = [
  s('m-signin', true, async (h) => {
    await h.goto('/login'); await h.shot('M01-signin-email');
    await h.type('input[type=email]', 'ada@example.com'); await h.click('Send my code'); await h.sleep(1500); await h.shot('M02-signin-code');
    await h.page.click('input[autocomplete=one-time-code]'); await h.page.keyboard.type('482913', { delay: 50 }); await h.sleep(800);
    if (h.url().startsWith('/verify')) await h.click('Verify email'); await h.sleep(2500); await h.shot('M03-signin-verified');
    await h.click('Continue'); await h.sleep(2000); await h.shot('M04-profile');
  }),
  s('m-wallet', { signedIn: true, profile }, async (h) => {
    await h.goto('/wallet'); await h.shot('M05-wallet');
    await h.click('MetaMask'); await h.sleep(6000); await h.shot('M06-wallet-connected');
  }, { wallet: { delay: 1500 } }),
  s('m-dashboard-new', me, async (h) => {
    await h.goto('/dashboard'); await h.sleep(1200); await h.shot('M07-dashboard-new-user');
    await h.page.click('[aria-label="Open mobile menu"]').catch(() => console.log('no mobile menu')); await h.sleep(800); await h.shot('M08-mobile-menu', { full: false });
  }),
  s('m-onboard', me, async (h) => {
    await h.goto('/onboard'); await h.sleep(1200); await h.shot('M09-onboard');
    await h.click('I’ve watched it');
    for (let i = 0; i < 2; i++) { await h.page.evaluate(() => [...document.querySelectorAll('a')].find(a => a.innerText.trim() === 'Follow ↗')?.click()); await h.sleep(1200); }
    for (const p of await h.page.browserContext().pages()) if (p !== h.page) await p.close();
    await h.click('Continue to questions'); await h.sleep(1200); await h.page.type('textarea', 'Mobile money daily, never used DeFi.'); await h.shot('M10-onboard-question', { full: false });
  }),
  s('m-done', done, async (h) => {
    await h.goto('/dashboard'); await h.sleep(1200); await h.shot('M11-dashboard-active');
    await h.goto('/module/si-her-collective-capital'); await h.sleep(1500); await h.shot('M12-module');
    await h.click('Start quiz'); await h.sleep(1500); await h.shot('M13-quiz', { full: false });
    await h.goto('/certificate'); await h.sleep(1500); await h.shot('M14-certificate');
    await h.goto('/settings'); await h.sleep(1500); await h.shot('M15-settings');
  }),
];
