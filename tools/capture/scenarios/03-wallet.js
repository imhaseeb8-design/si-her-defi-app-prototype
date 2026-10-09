// Wallet step states, starting signed in with a finished profile (fully simulated API + fake MetaMask).
const signedIn = { signedIn: true, profile: { name: 'Ada Nwosu', role: 'Product designer', organization: 'Lagos Fintech Collective', socialLink: 'https://linkedin.com/in/adanwosu', bio: '', photoUrl: '' } };
const opts = (h) => h.page.evaluate(() => [...document.querySelectorAll('button, a')].filter(e => e.offsetParent).map(e => e.innerText.trim().replace(/\s+/g, ' ').slice(0, 60)).join(' | '));
module.exports = [
  { name: 'wallet-happy', world: signedIn, wallet: { delay: 3000 }, steps: async (h) => {
    await h.goto('/wallet'); await h.sleep(1200);
    await h.shot('C02-wallet-metamask-detected');
    console.log('OPTS:', await opts(h));
    await h.click('MetaMask'); await h.sleep(900);
    await h.shot('C03-wallet-connecting');
    await h.sleep(3000);
    await h.shot('C04-wallet-signing');
    await h.sleep(4000);
    await h.shot('C05-wallet-connected');
    console.log('AFTER:', h.url(), await opts(h), JSON.stringify(h.ctx.log.slice(-6).map(x => x.call)));
  } },
  { name: 'wallet-wrong-network', world: signedIn, wallet: { chainId: '0x1', delay: 1500 }, steps: async (h) => {
    await h.goto('/wallet'); await h.click('MetaMask'); await h.sleep(2500);
    await h.shot('C06-wallet-wrong-network'); await h.sleep(3500); await h.shot('C07-wallet-wrong-network-after');
  } },
  { name: 'wallet-reject-connect', world: signedIn, wallet: { reject: 'connect', delay: 1200 }, steps: async (h) => {
    await h.goto('/wallet'); await h.click('MetaMask'); await h.sleep(2500); await h.shot('C08-wallet-rejected-connect');
  } },
  { name: 'wallet-reject-sign', world: signedIn, wallet: { reject: 'sign', delay: 1200 }, steps: async (h) => {
    await h.goto('/wallet'); await h.click('MetaMask'); await h.sleep(4500); await h.shot('C09-wallet-rejected-sign');
  } },
  { name: 'wallet-walletconnect', world: signedIn, steps: async (h) => {
    await h.goto('/wallet'); await h.click('WalletConnect'); await h.sleep(3500); await h.shot('C10-wallet-walletconnect-qr', { full: false });
  } },
];
