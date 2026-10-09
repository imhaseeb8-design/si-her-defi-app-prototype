// Sign-in + onboarding as a brand-new applicant (fully simulated API).
const btns = (h) => h.page.evaluate(() => [...document.querySelectorAll('button, a, [role=button], input[type=checkbox], input[type=file], textarea, input')].filter(e => e.offsetParent).map(e => `${e.tagName}:${(e.innerText || e.placeholder || e.name || e.type || '').trim().slice(0, 50)}${e.disabled ? ' [disabled]' : ''}`).join(' | '));
module.exports = [{
  name: 'journey', world: true,
  steps: async (h) => {
    await h.goto('/login');
    await h.shot('A01-signin-email-empty');
    await h.type('input[type=email], input[name=email]', 'ada@example.com');
    await h.shot('A02-signin-email-filled');
    await h.click('Send my code');
    await h.sleep(1500);
    await h.shot('A03-signin-code-empty');
    await h.page.click('input[autocomplete=one-time-code]');
    await h.page.keyboard.type('48291', { delay: 60 });
    await h.shot('A04-signin-code-partial');
    await h.page.keyboard.type('3', { delay: 60 });
    await h.sleep(800);
    await h.shot('A05-signin-code-filled');
    if (h.url().startsWith('/verify')) await h.click('Verify email');
    await h.sleep(2500);
    await h.shot('A06-signin-verified');
    await h.click('Continue');
    await h.sleep(2000);
    await h.shot('B01-profile-prefilled');
    // validation: name cleared
    await h.page.$eval('input[placeholder="Firstname Lastname"]', (e) => { e.focus(); e.select(); });
    await h.page.keyboard.press('Backspace');
    await h.click('Save & continue');
    await h.shot('B02-profile-name-required');
    await h.type('input[placeholder="Firstname Lastname"]', 'Ada Nwosu');
    const file = await h.page.$('input[type=file]');
    await file.uploadFile(require('path').join(__dirname, '../sample-avatar.png'));
    await h.sleep(1500);
    await h.shot('B03-profile-photo-added');
    await h.type('textarea', 'Designing savings tools for market traders in Lagos.', { clear: false });
    await h.shot('B04-profile-complete');
    await h.click('Save & continue');
    await h.sleep(2500);
    await h.shot('C01-wallet-not-connected');
    console.log('WALLET:', h.url(), await btns(h));
  },
}];
