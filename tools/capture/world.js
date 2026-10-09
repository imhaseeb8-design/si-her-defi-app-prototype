// A fake, stateful copy of the certifications API, seeded from real responses (fixtures/)
// with personal data swapped for a placeholder applicant. Lets the real app run as a brand-new user.
const fs = require('fs');
const path = require('path');

const FIX = path.join(__dirname, 'fixtures'); // sanitized copies of real API responses (see README)
const fx = (name) => JSON.parse(fs.readFileSync(path.join(FIX, `${name}.json`), 'utf8')).data;
const ok = (data, message = 'ok') => ({ success: true, message, data });
const fail = (status, message) => ({ __status: status, success: false, message });

const earnedBadge = () => ({ id: 'b1', slug: 'si-her-collective-capital', moduleSlug: 'si-her-collective-capital', week: 1, name: 'Collective Capital Badge', image: 'https://silver-causal-rodent-516.mypinata.cloud/ipfs/QmUAkcRAnnAncrvAfTnGLd95yZWGrVjgAT8CdbYMCovsT8', partnerName: 'SI<3>', earnedAt: '2026-10-09T15:00:00Z' });
const ADDRESS = '0x8f3a2b7c91d04e6a5b12c3d4e5f6a7b8c9d0e1f2';

function createWorld(o = {}) {
  const part1 = fx('_onboard_part1');
  const status = fx('_onboard_status');
  const s = {
    signedIn: false,
    user: { id: 'u_demo', email: 'ada@example.com', role: 'member', walletAddress: null, isEmailVerified: true },
    profile: { name: '', role: '', organization: '', socialLink: '', bio: '', photoUrl: '' },
    prefill: { prefilledFields: ['name', 'role', 'organization', 'socialLink'], name: 'Ada Nwosu', role: 'Product designer', organization: 'Lagos Fintech Collective', socialLink: 'https://linkedin.com/in/adanwosu' },
    progress: { status: 'not_started', videoWatched: false, followedSocialIds: [], answers: {}, completedAt: null },
    quiz: { attemptsUsed: 0, passed: false, answers: [], lastResult: null, retryAvailableAt: null },
    quizMode: 'pass',
    errors: {}, // e.g. { 'POST /auth/claim-seat': [404, 'message'] }
    ...o,
  };
  if (o.connected) s.user.walletAddress = ADDRESS;

  const handle = (method, p, body) => {
    const key = `${method} ${p}`;
    if (s.errors[key]) return fail(...s.errors[key]);
    switch (key) {
      case 'POST /auth/claim-seat': return ok({ email: body?.email, otpSent: true }, 'Verification code sent');
      case 'POST /auth/resend-otp': return ok({ email: body?.email, otpSent: true }, 'Verification code resent');
      case 'POST /auth/verify-otp':
        s.signedIn = true;
        return ok({ token: 'demo-token', accessToken: 'demo-token', user: s.user, profile: s.profile }, 'Email verified');
      case 'GET /auth/me': return ok({ user: s.user, profile: s.profile });
      case 'POST /auth/logout': return ok({});
      case 'GET /profile': return ok({ ...s.profile, prefilledFields: s.prefill.prefilledFields });
      case 'GET /profile/prefill': return ok(s.prefill);
      case 'POST /profile': case 'PUT /profile': case 'PATCH /profile':
        Object.assign(s.profile, body || {}); return ok(s.profile, 'Profile saved');
      case 'GET /wallet/status':
        return ok(s.user.walletAddress ? { connected: true, address: s.user.walletAddress, chainId: '0x2105', network: 'Base Mainnet', isOnBase: true } : { connected: false, address: null, chainId: null, network: null, isOnBase: false });
      case 'POST /wallet/nonce': return ok({ nonce: '482913', message: 'Sign this message to link your wallet to Si Her DeFi. Nonce: 482913' });
      case 'POST /wallet/connect': s.user.walletAddress = body?.address || ADDRESS; return ok({ connected: true, address: s.user.walletAddress });
      case 'DELETE /wallet/disconnect': s.user.walletAddress = null; return ok({ connected: false });
      case 'GET /onboard/status': {
        const done = s.progress.status === 'completed';
        return ok({ ...status, part1Done: done, part1Status: s.progress.status, part1CompletedAt: s.progress.completedAt });
      }
      case 'GET /onboard/part1': return ok({ ...part1, progress: s.progress });
      case 'PUT /onboard/part1/draft': Object.assign(s.progress, body || {}, { status: 'draft' }); return ok({ progress: s.progress });
      case 'POST /onboard/part1':
        Object.assign(s.progress, body || {}, { status: 'completed', completedAt: new Date().toISOString() }); return ok({ progress: s.progress });
      case 'GET /settings': return ok(s.settings || fx('_settings'));
      case 'PATCH /settings': s.settings = { ...(s.settings || fx('_settings')), ...body }; return ok(s.settings);
      case 'GET /certificate': {
        const c = { ...fx('_certificate'), recipientName: s.profile.name, walletAddress: s.user.walletAddress };
        if (!s.quiz.passed) return ok(c);
        const badge = { ...earnedBadge(), moduleTitle: 'Si Her Collective Capital' };
        Object.assign(c, { status: s.minted ? 'minted' : 'earned', badges: [badge], stillOpen: [], issuedAt: '2026-12-03T17:00:00Z', verificationCode: 'SHD-01-7Q4K', verifyUrl: 'https://certifications.si3.space/siherdefi/verify/SHD-01-7Q4K', canMint: !s.minted });
        if (s.minted) c.onChain = { ...c.onChain, enabled: true, contractAddress: '0x5b2e000000000000000000000000000000c3a1', tokenId: '42', txHash: '0x9f' + 'e1'.repeat(31), mintedAt: '2026-12-04T10:00:00Z', explorerUrl: 'https://basescan.org/tx/0x9f' + 'e1'.repeat(31) };
        return ok(c);
      }
      case 'GET /badges': return ok(s.quiz.passed ? { totalCohortBadges: 12, earnedCount: 1, badges: [earnedBadge()] } : fx('_badges'));
      case 'GET /modules': return ok(fx('_modules').map((m) => (m.week === 1 && s.quiz.passed ? { ...m, isCompleted: true, quiz: { ...m.quiz, isPassed: true, attemptsUsed: s.quiz.attemptsUsed } } : m)));
      case 'GET /modules/cms/speakers': return ok(fx('_modules_cms_speakers'));
      case 'GET /partners': return ok(fx('_partners'));
      case 'GET /partners/more-ways': return ok(fx('_partners_more-ways'));
    }
    if (p.startsWith('/quiz/')) {
      const slug = p.split('/')[2];
      const base = fx('_quiz_si-her-collective-capital');
      const q = s.quiz;
      if (method === 'GET') return ok({ ...base, moduleSlug: slug, attemptsUsed: q.attemptsUsed, attemptsRemaining: base.maxAttempts - q.attemptsUsed, isPassed: q.passed, currentAttempt: q.answers.length ? { attemptNumber: q.attemptsUsed + 1, answers: q.answers } : null, lastResult: q.lastResult, retryAvailableAt: q.retryAvailableAt });
      if (method === 'POST' && p.endsWith('/answer')) {
        const KEY = { 1: 'B', 2: 'C', 3: 'A' };
        const wrong = s.quizMode === 'fail' && body.questionNumber === 2;
        const isCorrect = !wrong && body.selectedOption === KEY[body.questionNumber];
        const a = { attemptNumber: q.attemptsUsed + 1, questionNumber: body.questionNumber, selectedOption: body.selectedOption, isCorrect,
          explanation: isCorrect ? 'Collective capital works when members pool resources and share decisions transparently.' : '', hint: isCorrect ? null : { timestamp: '0:30', title: 'Treasury architecture' } };
        q.answers.push(a);
        if (body.questionNumber === base.totalQuestions) {
          const score = q.answers.filter((x) => x.isCorrect).length; const passed = score >= base.passingScore;
          const review = q.answers.filter((x) => !x.isCorrect).map((x) => ({ questionNumber: x.questionNumber, questionText: base.questions[x.questionNumber - 1].questionText, hint: x.hint }));
          q.attemptsUsed += 1; q.passed = passed; q.answers = [];
          q.retryAvailableAt = passed || q.attemptsUsed < base.maxAttempts ? null : new Date(Date.now() + 24 * 3600e3).toISOString();
          a.result = q.lastResult = { passed, score, totalQuestions: base.totalQuestions, passingScore: base.passingScore, review, attemptsUsed: q.attemptsUsed, attemptsRemaining: base.maxAttempts - q.attemptsUsed, retryAvailableAt: q.retryAvailableAt, badgeEarned: passed ? base.badge : null, certificateUnlocked: passed };
        }
        return ok(a);
      }
    }
    if (method === 'GET' && p.startsWith('/modules/')) {
      const m = fx('_modules').find((x) => p.endsWith(x.slug) || p.endsWith(x.id));
      return m ? ok(m) : fail(404, 'Module not found');
    }
    if (method !== 'GET') return ok({}, 'mocked');
    return fail(404, `No mock for ${key}`);
  };
  return { state: s, handle };
}

module.exports = { createWorld, ADDRESS };
