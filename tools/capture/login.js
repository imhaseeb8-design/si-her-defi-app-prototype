// Opens a visible Chrome window. Sign in with email + 6-digit code; it closes itself once signed in.
const { launch, BASE } = require('./common');
(async () => {
  const b = await launch(false);
  const [p] = await b.pages();
  await p.goto(BASE, { waitUntil: 'networkidle2' });
  for (let i = 0; i < 600; i++) {
    const ok = await p.evaluate(() => !!localStorage.getItem('siherdefi_auth_token')).catch(() => false);
    if (ok) { console.log('Signed in.'); await new Promise(r => setTimeout(r, 3000)); await b.close(); return; }
    await new Promise(r => setTimeout(r, 1000));
  }
  console.log('Timed out'); await b.close();
})();
