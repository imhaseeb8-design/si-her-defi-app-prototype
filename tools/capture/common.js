const puppeteer = require('puppeteer-core');
const path = require('path');
exports.CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
// Browser profile with the signed-in session. Lives outside the repo; never commit it.
exports.PROFILE = process.env.CAPTURE_PROFILE || path.join(process.env.HOME, '.si-her-defi-capture-profile');
exports.BASE = 'https://certifications.si3.space/siherdefi';
exports.API = 'https://certifications-server.vercel.app/api/v1';
exports.launch = (headless = true) => puppeteer.launch({
  executablePath: exports.CHROME, userDataDir: exports.PROFILE, headless,
  defaultViewport: { width: 1440, height: 900 }, args: ['--window-size=1440,980'],
});
