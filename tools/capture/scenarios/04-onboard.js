// New user's dashboard + Part 1 onboarding (video → follow socials → 4 questions → done). Simulated API.
const me = { signedIn: true, connected: true, profile: { name: 'Ada Nwosu', role: 'Product designer', organization: 'Lagos Fintech Collective', socialLink: 'https://linkedin.com/in/adanwosu', bio: 'Designing savings tools for market traders in Lagos.', photoUrl: '' } };
const ui = (h) => h.page.evaluate(() => [...document.querySelectorAll('button, a, input, textarea, [role=checkbox]')].filter(e => e.offsetParent).map(e => `${e.tagName[0]}:${(e.innerText || e.placeholder || e.type || '').trim().replace(/\s+/g, ' ').slice(0, 45)}${e.disabled ? '[x]' : ''}`).join(' | '));
module.exports = [
  { name: 'onboard-explore', world: me, steps: async (h) => {
    await h.goto('/dashboard'); await h.sleep(1500);
    await h.shot('D01-dashboard-new-user');
    await h.click('Start here'); await h.sleep(2500);
    await h.shot('E01-onboard-start');
    h.page.browserContext().on('targetcreated', async (t) => { const pg = await t.page().catch(() => null); if (pg && pg !== h.page) await pg.close().catch(() => {}); });
    await h.click('I’ve watched it'); await h.sleep(1000);
    await h.shot('E02-onboard-video-watched');
    await h.click('Follow ↗'); await h.sleep(1500); await h.page.bringToFront();
    await h.shot('E03-onboard-followed-one');
    await h.page.evaluate(() => [...document.querySelectorAll('a')].filter(a => a.innerText.includes('Follow')).pop().click()); await h.sleep(1500); await h.page.bringToFront();
    await h.shot('E04-onboard-followed-both');
    await h.click('Continue to questions'); await h.sleep(1500);
    await h.shot('E05-onboard-questions-empty');
    const answers = [
      'I use a mobile money wallet daily and bought some USDC once, but I have never used a DeFi protocol.',
      'A friend in the SI<3> community recommended it. I want to understand stablecoin savings and how lending pools manage risk.',
      'I want to prototype a savings circle (ajo) for market traders that runs on Base.',
      'I learn best with real examples and short exercises.',
    ];
    for (let i = 0; i < 4; i++) {
      const ta = await h.page.$('textarea');
      if (!ta) { console.log('no textarea at', i); break; }
      if (i === 0) { await ta.type(answers[i].slice(0, 30), { delay: 2 }); await h.shot('E06-onboard-q1-typing'); await ta.type(answers[i].slice(30), { delay: 2 }); }
      else await ta.type(answers[i], { delay: 2 });
      await h.shot(`E${String(7 + i * 2).padStart(2, '0')}-onboard-q${i + 1}-answered`);
      console.log(`Q${i + 1}:`, await ui(h));
      const last = await h.page.evaluate(() => [...document.querySelectorAll('button')].filter(b => b.offsetParent).map(b => b.innerText.trim()).pop());
      await h.click(last); await h.sleep(1800);
      await h.shot(`E${String(8 + i * 2).padStart(2, '0')}-onboard-after-q${i + 1}`);
    }
    await h.click('Back to dashboard', 'button'); await h.sleep(2500);
    await h.shot('D02-dashboard-part1-done');
  } },
];
