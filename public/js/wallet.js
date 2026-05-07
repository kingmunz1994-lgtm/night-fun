// Night ecosystem wallet connector — shared across all Night apps
// Supports Midnight DApp Connector v4 (Lace, 1AM, Nocturne) and demo mode fallback

var nightWallet = (function () {
  var _state = { connected: false, demo: false, address: null, night: 0, dust: 0, api: null };
  var _listeners = [];

  function _notify() { _listeners.forEach(fn => { try { fn({ ..._state }); } catch (e) {} }); }

  function onStateChange(fn) { _listeners.push(fn); }

  function hasLace() { return !!(window.midnight && Object.values(window.midnight).some(w => w?.connect)); }

  async function connectLace() {
    const m = window.midnight;
    if (!m) throw new Error('Midnight wallet not found — install Lace, 1AM, or Nocturne.');
    // DApp Connector v4: use connect(networkId) — enable() is removed
    let walletEntry = null;
    if (m.mnLace?.connect) walletEntry = m.mnLace;
    else {
      const key = Object.keys(m).find(k => m[k]?.connect);
      if (key) walletEntry = m[key];
    }
    if (!walletEntry) throw new Error('No compatible Midnight wallet found.');
    let api = null;
    for (const net of ['mainnet', 'preprod', 'undeployed']) {
      try { api = await walletEntry.connect(net); if (api) break; } catch (e) {}
    }
    if (!api) throw new Error('Wallet connection rejected.');
    let address = 'midnight1unknown';
    let night = 0, dust = 0;
    try {
      const unshAddr = await api.getUnshieldedAddress?.();
      if (unshAddr) address = unshAddr;
    } catch { /* shielded-only wallet */ }
    try {
      const bals = await api.balances?.() ?? {};
      night = Number(bals.night ?? bals.NIGHT ?? 0);
      dust  = Number(bals.dust  ?? bals.DUST  ?? 0);
    } catch { /* balance unavailable */ }
    _state = { connected: true, demo: false, address, night, dust, api };
    _notify();
    return { ..._state };
  }

  function connectDemo() {
    _state = {
      connected: true, demo: true,
      address: 'mn_addr_preprod1' + Math.random().toString(36).slice(2, 14),
      night: 50000, dust: 1000, api: null,
    };
    _notify();
    return { ..._state };
  }

  async function connect(mode) {
    if (mode === 'demo') return connectDemo();
    return connectLace();
  }

  function disconnect() {
    _state = { connected: false, demo: false, address: null, night: 0, dust: 0, api: null };
    _notify();
  }

  function getState()    { return { ..._state }; }
  function isConnected() { return _state.connected; }
  function isDemo()      { return _state.demo; }
  function getAddress()  { return _state.address; }

  return { connect, disconnect, onStateChange, hasLace, isConnected, isDemo, getAddress, getState };
})();
