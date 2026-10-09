// Pass 1: every signed-in route exactly as a finished user sees it (writes still blocked).
const routes = ['dashboard', 'modules', 'badges', 'certificate', 'partners', 'partners/more-ways', 'settings', 'profile', 'wallet'];
module.exports = routes.map((r, i) => ({
  name: `real-${String(i + 1).padStart(2, '0')}-${r.replace('/', '-')}`,
  steps: async (h) => { await h.goto('/' + r); await h.sleep(1500); await h.shot(`real-${String(i + 1).padStart(2, '0')}-${r.replace('/', '-')}`); },
}));
