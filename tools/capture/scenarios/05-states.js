// Remaining states: sign-in errors, empty application data, save-and-exit, menus, module, certificate, settings.
const profile = { name: 'Ada Nwosu', role: 'Product designer', organization: 'Lagos Fintech Collective', socialLink: 'https://linkedin.com/in/adanwosu', bio: 'Designing savings tools for market traders in Lagos.', photoUrl: '' };
const me = { signedIn: true, connected: true, profile };
const done = { ...me, progress: { status: 'completed', videoWatched: true, followedSocialIds: ['onboarding-social-x', 'onboarding-social-linkedin'], answers: {}, completedAt: '2026-10-08T18:00:00Z' } };
const links = (h) => h.page.evaluate(() => [...document.querySelectorAll('a[href]')].filter(a => a.offsetParent).map(a => `${a.innerText.trim().replace(/\s+/g, ' ').slice(0, 30)}→${a.getAttribute('href')}`).join(' | '));
module.exports = [
  { name: 'signin-unknown-email', world: { errors: { 'POST /auth/claim-seat': [404, 'We couldn’t find a Si Her DeFi application for that email.'] } }, steps: async (h) => {
    await h.goto('/login'); await h.type('input[type=email]', 'someone@example.com'); await h.click('Send my code'); await h.sleep(1200);
    await h.shot('A07-signin-email-not-found');
    await h.page.$eval('input[type=email]', (e) => { e.focus(); e.select(); }); await h.page.keyboard.type('ada@'); await h.click('Send my code');
    await h.shot('A08-signin-email-invalid');
  } },
  { name: 'signin-wrong-code', world: { errors: { 'POST /auth/verify-otp': [400, 'That code is incorrect. Check your email and try again.'] } }, steps: async (h) => {
    await h.goto('/verify?email=ada%40example.com'); await h.page.click('input[autocomplete=one-time-code]'); await h.page.keyboard.type('111111', { delay: 40 }); await h.sleep(800);
    if ((await h.page.$$eval('button', (b) => b.filter(x => x.innerText.includes('Verify email') && !x.disabled).length))) await h.click('Verify email');
    await h.sleep(1200); await h.shot('A09-signin-code-wrong');
    await h.sleep(40000); await h.shot('A10-signin-code-resend-ready');
    await h.click('Resend'); await h.sleep(1200); await h.shot('A11-signin-code-resent');
  } },
  { name: 'signin-help', world: true, steps: async (h) => {
    await h.goto('/verify?email=ada%40example.com'); console.log('VERIFY LINKS:', await links(h));
    await h.click('Need help?'); await h.sleep(1200); await h.shot('A12-signin-need-help');
  } },
  { name: 'profile-no-application-data', world: { signedIn: true, prefill: { prefilledFields: [] } }, steps: async (h) => {
    await h.goto('/profile'); await h.sleep(1500); await h.shot('B05-profile-empty-no-prefill');
  } },
  { name: 'profile-edit-from-dashboard', world: me, steps: async (h) => {
    await h.goto('/profile?from=dashboard'); await h.sleep(1500); await h.shot('B06-profile-edit-from-dashboard');
  } },
  { name: 'onboard-save-exit', world: me, steps: async (h) => {
    await h.goto('/onboard'); await h.click('I’ve watched it');
    for (let i = 0; i < 2; i++) { await h.page.evaluate(() => [...document.querySelectorAll('a')].find(a => a.innerText.trim() === 'Follow ↗')?.click()); await h.sleep(1200); }
    for (const p of await h.page.browserContext().pages()) if (p !== h.page) await p.close();
    await h.click('Continue to questions'); await h.page.type('textarea', 'Mobile money daily, never used DeFi.'); await h.click('Next');
    await h.click('Save & exit'); await h.sleep(2500); await h.shot('E15-onboard-saved-exit');
    if (!h.url().includes('dashboard')) { await h.goto('/dashboard'); }
    await h.shot('D03-dashboard-part1-in-progress');
  } },
  { name: 'dashboard-menus', world: done, steps: async (h) => {
    await h.goto('/dashboard'); await h.sleep(1500); console.log('DASH LINKS:', await links(h));
    await h.click('Add to calendar'); await h.shot('D04-dashboard-add-to-calendar', { full: false }); await h.page.keyboard.press('Escape');
    await h.page.click('[aria-label="User menu"], [aria-label="Account options"]').catch(() => console.log('no user menu')); await h.sleep(700); await h.shot('D05-dashboard-user-menu', { full: false }); await h.page.keyboard.press('Escape');
    await h.page.click('[aria-label="Collapse sidebar"]').catch(() => console.log('no collapse')); await h.sleep(800); await h.shot('D06-dashboard-sidebar-collapsed', { full: false });
  } },
  { name: 'module', world: done, steps: async (h) => {
    await h.goto('/dashboard'); await h.sleep(1000);
    const href = await h.page.evaluate(() => [...document.querySelectorAll('a[href]')].map(a => a.getAttribute('href')).find(x => /module|week|session/.test(x)));
    console.log('MODULE HREF:', href);
    if (href) { await h.page.goto(new URL(href, h.page.url()).href, { waitUntil: 'networkidle2' }); await h.sleep(2000); await h.shot('F01-module-week1'); console.log('MODULE LINKS:', await links(h)); }
  } },
  { name: 'certificate-settings', world: done, steps: async (h) => {
    await h.goto('/certificate'); await h.sleep(1500); await h.shot('G01-certificate-locked');
    await h.goto('/settings'); await h.sleep(1500); await h.shot('H01-settings');
    await h.click('Disconnect'); await h.sleep(900); await h.shot('H02-settings-disconnect', { full: false });
  } },
];
