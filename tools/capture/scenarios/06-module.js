// Module page + quiz (pass and fail), then badge/certificate states. Simulated API.
const profile = { name: 'Ada Nwosu', role: 'Product designer', organization: 'Lagos Fintech Collective', socialLink: 'https://linkedin.com/in/adanwosu', bio: 'Designing savings tools for market traders in Lagos.', photoUrl: '' };
const done = { signedIn: true, connected: true, profile, progress: { status: 'completed', videoWatched: true, followedSocialIds: ['onboarding-social-x', 'onboarding-social-linkedin'], answers: {}, completedAt: '2026-10-08T18:00:00Z' } };
const ui = (h) => h.page.evaluate(() => [...document.querySelectorAll('button, a')].filter(e => e.offsetParent).map(e => (e.innerText || e.getAttribute('aria-label') || '').trim().replace(/\s+/g, ' ').slice(0, 40)).join(' | '));
const answer = async (h, keys, prefix) => {
  for (let i = 0; i < keys.length; i++) {
    await h.page.evaluate((k) => { const b = [...document.querySelectorAll('[role=dialog] button, button')].filter(x => x.offsetParent).find(x => x.innerText.trim().startsWith(k + '\n') || x.innerText.trim().startsWith(k + ' ') || x.innerText.trim() === k); b?.click(); }, keys[i]);
    await h.sleep(1200); await h.shot(`${prefix}-q${i + 1}-answered`, { full: false });
    const next = await h.page.evaluate(() => [...document.querySelectorAll('[role=dialog] button')].filter(b => b.offsetParent && /Next|See result|Finish|Submit|Continue/.test(b.innerText)).map(b => b.innerText.trim())[0]);
    if (next) { await h.click(next, '[role=dialog] button'); await h.sleep(1200); }
  }
  await h.sleep(800); await h.shot(`${prefix}-result`, { full: false });
};
module.exports = [
  { name: 'module-pass', world: done, steps: async (h) => {
    await h.goto('/dashboard'); await h.goto('/module/si-her-collective-capital'); await h.sleep(2000);
    await h.shot('F01-module-week1');
    console.log('MOD UI:', await ui(h));
    await h.click('Start quiz');
    await h.sleep(1500); await h.shot('F02-quiz-start', { full: false });
    console.log('QUIZ UI:', await h.page.evaluate(() => document.querySelector('[role=dialog]')?.innerText.slice(0, 600)));
    await answer(h, ['B', 'C', 'A'], 'F03-quiz-pass');
    await h.page.keyboard.press('Escape'); await h.goto('/dashboard'); await h.goto('/module/si-her-collective-capital'); await h.shot('F04-module-week1-passed');
    await h.goto('/dashboard'); await h.sleep(1500); await h.shot('D07-dashboard-badge-earned');
    await h.goto('/certificate'); await h.sleep(1500); await h.shot('G02-certificate-earned');
  } },
  { name: 'module-fail', world: { ...done, quizMode: 'fail' }, steps: async (h) => {
    await h.goto('/dashboard'); await h.goto('/module/si-her-collective-capital'); await h.sleep(1500);
    await h.click('Start quiz'); await h.sleep(1500);
    await answer(h, ['B', 'A', 'A'], 'F05-quiz-fail');
    await h.page.keyboard.press('Escape'); await h.goto('/dashboard'); await h.goto('/module/si-her-collective-capital'); await h.shot('F06-module-week1-retry-later');
  } },
  { name: 'module-fail-last-attempt', world: { ...done, quizMode: 'fail', quiz: { attemptsUsed: 2, passed: false, answers: [], lastResult: null, retryAvailableAt: null } }, steps: async (h) => {
    await h.goto('/dashboard'); await h.goto('/module/si-her-collective-capital'); await h.sleep(1500);
    await h.click('Try again'); await h.sleep(1500);
    await answer(h, ['B', 'A', 'A'], 'F08-quiz-fail-last');
    await h.page.keyboard.press('Escape'); await h.goto('/module/si-her-collective-capital'); await h.shot('F09-module-week1-locked-24h');
  } },
  { name: 'certificate-minted', world: { ...done, quiz: { attemptsUsed: 1, passed: true, answers: [], lastResult: null, retryAvailableAt: null }, minted: true }, steps: async (h) => {
    await h.goto('/certificate'); await h.sleep(1500); await h.shot('G03-certificate-minted');
  } },
  { name: 'module-upcoming', world: done, steps: async (h) => {
    await h.goto('/dashboard'); await h.goto('/module/token-fundamentals'); await h.sleep(1500); await h.shot('F07-module-upcoming');
  } },
];
