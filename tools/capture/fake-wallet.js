// A fake MetaMask (EIP-1193 + EIP-6963) injected into the test browser so the real wallet step
// can be walked through: detect → connect → sign → connected, plus wrong-network and reject paths.
// No real keys, funds or chains are involved.
module.exports = (opts) => {
  const o = Object.assign({ address: '0x8f3a2b7c91d04e6a5b12c3d4e5f6a7b8c9d0e1f2', chainId: '0x2105', delay: 2500, reject: null }, opts);
  const listeners = {};
  let chainId = o.chainId; let connected = false;
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  const err = (code, message) => Object.assign(new Error(message), { code });
  const provider = {
    isMetaMask: true, _metamask: { isUnlocked: async () => true },
    on: (e, f) => { (listeners[e] = listeners[e] || []).push(f); return provider; },
    removeListener: (e, f) => { listeners[e] = (listeners[e] || []).filter((x) => x !== f); return provider; },
    async request({ method, params }) {
      window.__walletCalls = (window.__walletCalls || []).concat(method);
      switch (method) {
        case 'eth_accounts': return connected ? [o.address] : [];
        case 'eth_requestAccounts': case 'wallet_requestPermissions':
          await wait(o.delay); if (o.reject === 'connect') throw err(4001, 'User rejected the request.');
          connected = true; (listeners.accountsChanged || []).forEach((f) => f([o.address]));
          return method === 'eth_requestAccounts' ? [o.address] : [{ parentCapability: 'eth_accounts' }];
        case 'wallet_getPermissions': return connected ? [{ parentCapability: 'eth_accounts' }] : [];
        case 'wallet_revokePermissions': connected = false; return null;
        case 'eth_chainId': return chainId;
        case 'net_version': return String(parseInt(chainId, 16));
        case 'wallet_switchEthereumChain':
          await wait(o.delay); if (o.reject === 'switch') throw err(4001, 'User rejected the request.');
          chainId = params[0].chainId; (listeners.chainChanged || []).forEach((f) => f(chainId)); return null;
        case 'wallet_addEthereumChain': return null;
        case 'personal_sign': case 'eth_signTypedData_v4':
          await wait(o.delay); if (o.reject === 'sign') throw err(4001, 'User denied message signature.');
          return '0x' + 'ab'.repeat(65);
        case 'eth_blockNumber': return '0x1';
        case 'eth_getBalance': return '0x0';
        default: return null;
      }
    },
  };
  window.ethereum = provider;
  const info = { uuid: '7f1c1a2e-0000-4000-8000-000000000001', name: 'MetaMask', rdns: 'io.metamask',
    icon: 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 32 32%22%3E%3Crect width=%2232%22 height=%2232%22 rx=%228%22 fill=%22%23F6851B%22/%3E%3C/svg%3E' };
  const announce = () => window.dispatchEvent(new CustomEvent('eip6963:announceProvider', { detail: Object.freeze({ info, provider }) }));
  window.addEventListener('eip6963:requestProvider', announce);
  announce();
};
