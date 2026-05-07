// ── Night Fun — launch, curve, Night-ID ──────────────────────

// ── State ─────────────────────────────────────────────────────
var nftdData   = JSON.parse(localStorage.getItem('nf_token') || 'null');
var _curveState = JSON.parse(localStorage.getItem('nf_curve') || 'null');
var _nightIdLocal = JSON.parse(localStorage.getItem('nf_nightid') || '{}');
var walletState = { connected: false, demo: false, address: null };

function saveToken() { localStorage.setItem('nf_token', JSON.stringify(nftdData)); }
function saveCurve() { if (_curveState) localStorage.setItem('nf_curve', JSON.stringify(_curveState)); }
function saveNightId() { localStorage.setItem('nf_nightid', JSON.stringify(_nightIdLocal)); }

// ── Wallet ─────────────────────────────────────────────────────
function connectDemo() {
  walletState = {
    connected: true, demo: true,
    address: 'mn_addr_preprod1' + Math.random().toString(36).slice(2, 14),
  };
  closeModal('ov-wallet');
  updateWalletUI();
  toast('🎭 Demo mode — no real funds', 'success');
  renderAll();
}

async function connectRealWallet() {
  const btn = document.getElementById('wc-connect-btn');
  if (btn) { btn.disabled = true; btn.textContent = 'Connecting…'; }
  try {
    const ws = await nightWallet.connect('lace');
    walletState = { connected: true, demo: false, address: ws.address };
    closeModal('ov-wallet');
    updateWalletUI();
    toast('✓ Wallet connected', 'success');
    renderAll();
  } catch (err) {
    toast('Connection failed: ' + (err.message || 'Wallet not found'), 'error');
    if (btn) { btn.disabled = false; btn.textContent = '⊘ Connect Lace / 1AM / Nocturne'; }
  }
}

function handleWalletClick() {
  if (walletState.connected) {
    if (confirm('Disconnect?')) {
      walletState = { connected: false, demo: false, address: null };
      nightWallet.disconnect?.();
      updateWalletUI();
    }
  } else {
    openModal('ov-wallet');
  }
}

function updateWalletUI() {
  const dot = document.getElementById('wallet-dot');
  const lbl = document.getElementById('wallet-label');
  if (!dot || !lbl) return;
  dot.style.background = walletState.connected ? '#00d68f' : '#ef4444';
  lbl.textContent = walletState.connected
    ? (walletState.demo ? '🎭 Demo' : walletState.address.slice(0, 14) + '…')
    : 'Sign in';
}

// ── Launch token ───────────────────────────────────────────────
function launchNightFun() {
  const name   = (document.getElementById('nf-name')?.value || '').trim();
  const symbol = (document.getElementById('nf-symbol')?.value || '').trim().toUpperCase();
  const supply = (document.getElementById('nf-supply')?.value || '1,000,000,000').trim();
  const desc   = (document.getElementById('nf-desc')?.value || '').trim();
  const bond   = parseFloat(document.getElementById('nf-bond')?.value || '10') || 10;

  if (!name || !symbol) { toast('Enter project name and token symbol', 'error'); return; }
  if (bond < 10) { toast('Minimum creator bond is 10 tNIGHT', 'error'); return; }
  if (!walletState.connected) { openModal('ov-wallet'); return; }

  const btn = document.getElementById('nf-launch-btn');
  if (btn) { btn.disabled = true; btn.textContent = 'Deploying…'; }

  const circuit = document.getElementById('nf-deploy-circuit');
  const result  = document.getElementById('nf-launch-result');
  if (circuit) circuit.style.display = 'block';
  if (result)  result.style.display = 'none';

  const steps = [
    { label: `Compiling FungibleToken circuit…`,           sub: `Compact → WASM · ${symbol}`, ms: 900 },
    { label: 'Generating deploy ZK proof…',                sub: 'zkConfig · Midnight Preprod', ms: 1100 },
    { label: `Deploying ${name} contract…`,                sub: `createToken(name="${name}", symbol="${symbol}", supply=${supply})`, ms: 1000 },
    { label: 'Locking creator bond + creator tokens…',     sub: `${bond} tNIGHT bond · creator tokens locked 30 days · no-dump enforced`, ms: 800 },
    { label: 'Minting initial supply to deployer…',        sub: 'transfer() · shielded UTXO · Zswap', ms: 800 },
    { label: 'Registering on LunarSwap pool…',             sub: `addLiquidity() · ${symbol}/NIGHT`, ms: 850 },
    { label: 'Deploying Night Store merch contract…',      sub: 'Night Store · Printful integration', ms: 750 },
    { label: '✓ Token live · bond locked · merch store live', sub: `Night Fun · Midnight preprod`, ms: 0 },
  ];

  if (circuit) {
    circuit.innerHTML = steps.map((s, i) =>
      `<div id="nfc-${i}" style="display:flex;align-items:center;gap:7px;">
        <span class="ct-dot wait" id="nfd-${i}"></span>
        <span>${s.label}</span>
      </div>`
    ).join('');
  }

  let i = 0;
  function next() {
    if (i > 0) {
      const pd = document.getElementById(`nfd-${i - 1}`);
      const pr = document.getElementById(`nfc-${i - 1}`);
      if (pd) pd.className = 'ct-dot done';
      if (pr) pr.style.color = 'var(--green)';
    }
    if (i >= steps.length) {
      const addr = `mn_contract_preprod1${symbol.toLowerCase()}${Math.random().toString(36).slice(2, 10)}`;
      onDeployed({ name, symbol, supply, addr, desc, bond });
      if (btn) { btn.disabled = false; btn.textContent = '🌙 Launch another token →'; }
      return;
    }
    const dot = document.getElementById(`nfd-${i}`);
    const row = document.getElementById(`nfc-${i}`);
    if (dot) dot.className = 'ct-dot active';
    if (row) row.style.color = 'var(--cyan)';
    const ms = steps[i].ms;
    i++;
    if (ms > 0) setTimeout(next, ms); else next();
  }
  next();
}

function onDeployed({ name, symbol, supply, addr, desc, bond }) {
  nftdData = { name, symbol, supply, address: addr, desc, bond: bond || 10, epoch: 0, epochRev: 0, holders: 1, claimable: 0, revFeed: [], holderRevBps: 5000 };
  saveToken();

  const title = document.getElementById('nf-result-title');
  const sub   = document.getElementById('nf-result-sub');
  const addrEl = document.getElementById('nf-result-addr');
  const rs    = document.getElementById('nf-result');
  if (title)  title.textContent = `🎉 ${name} ($${symbol}) deployed!`;
  if (sub)    sub.textContent = `FungibleToken · Midnight Preprod · ZK-private`;
  if (addrEl) addrEl.textContent = addr;
  const rSupply = document.getElementById('nf-rs-supply');
  const rSym    = document.getElementById('nf-rs-symbol');
  if (rSupply) rSupply.textContent = supply;
  if (rSym)    rSym.textContent    = symbol;

  const result = document.getElementById('nf-launch-result');
  if (result) result.style.display = 'block';

  nftdShow(nftdData);
  toast(`✓ $${symbol} deployed!`, 'success');
  renderCurvePanel();
  awardNightScore('token');
}

// ── Token dashboard ────────────────────────────────────────────
function nftdShow(data) {
  nftdData = data;
  saveToken();
  const dash = document.getElementById('nf-token-dash');
  const noD  = document.getElementById('nf-token-nodash');
  if (dash) dash.style.display = 'block';
  if (noD)  noD.style.display  = 'none';
  nftdRender();
}

function nftdRender() {
  if (!nftdData) return;
  const d   = nftdData;
  const set = (id, val) => { const e = document.getElementById(id); if (e) e.textContent = val; };
  set('nftd-name',       d.name     || '—');
  set('nftd-symbol',     d.symbol   ? '$' + d.symbol : '—');
  set('nftd-addr',       d.address  ? d.address.slice(0, 18) + '…' : 'preprod');
  set('nftd-supply',     d.supply   ? Number(String(d.supply).replace(/,/g,'')).toLocaleString() : '—');
  set('nftd-holders',    d.holders  || '1');
  set('nftd-bond',       (d.bond || 10) + ' tNIGHT');
  set('nftd-epoch',      d.epoch != null ? 'Epoch ' + d.epoch : 'Epoch 0');
  set('nftd-epoch-rev',  d.epochRev ? d.epochRev + ' NIGHT' : '0 NIGHT');
  set('nftd-merch-sales', d.merchSales || '0');
  set('nftd-claimable',  d.claimable ? d.claimable + ' NIGHT' : '0 NIGHT');
  set('nftd-rev-bps',    d.holderRevBps ? (d.holderRevBps / 100).toFixed(1) + '%' : '50%');

  const feed = document.getElementById('nftd-rev-feed');
  if (feed && d.revFeed && d.revFeed.length) {
    feed.innerHTML = d.revFeed.slice(-5).reverse().map(f => `
      <div style="display:flex;align-items:center;justify-content:space-between;padding:10px 14px;background:var(--raised);border:1px solid var(--rim);border-radius:8px;font-size:12px;margin-bottom:6px;">
        <div><span style="color:var(--green);margin-right:8px;">↗</span>${f.desc}</div>
        <div style="font-family:var(--mono);font-weight:700;color:var(--green);">+${f.amount} NIGHT</div>
      </div>`).join('');
  } else if (feed) {
    feed.innerHTML = '<div style="font-size:12px;color:var(--muted);padding:12px;text-align:center;">No revenue events yet.</div>';
  }
}

async function nftdCloseEpoch() {
  if (!nftdData) { toast('No token deployed', 'error'); return; }
  toast('Closing epoch on Midnight…', 'info');
  try {
    const res = await apiPost('/api/nightfun/close-epoch', { tokenAddress: nftdData.address });
    nftdData.epoch = (nftdData.epoch || 0) + 1;
    nftdData.epochRev = 0;
    nftdData.revFeed = nftdData.revFeed || [];
    nftdData.revFeed.push({ desc: 'Epoch closed · revenue distributed', amount: res.distributed || 0 });
    nftdShow(nftdData);
    toast('✓ Epoch closed — revenue distributed to holders', 'success');
  } catch {
    nftdData.epoch = (nftdData.epoch || 0) + 1;
    nftdData.revFeed = nftdData.revFeed || [];
    nftdData.revFeed.push({ desc: 'Epoch closed (simulated)', amount: Math.floor(Math.random() * 50) });
    nftdShow(nftdData);
    toast('Epoch closed (simulation — API offline)', 'info');
  }
}

async function nftdRefresh() {
  if (!nftdData) return;
  toast('Refreshing from chain…', 'info');
  try {
    const res = await apiGet('/api/nightfun/state?addr=' + (nftdData.address || ''));
    Object.assign(nftdData, res);
    nftdShow(nftdData);
    toast('✓ Refreshed', 'success');
  } catch {
    toast('Chain offline — showing cached data', 'info');
  }
}

// ── Bonding curve math ─────────────────────────────────────────
function calcBuy(nightIn) {
  if (!_curveState || nightIn <= 0) return 0;
  const vn = _curveState.nightReserve, vt = _curveState.tokenReserve;
  return Math.floor(vt * nightIn / (vn + nightIn));
}

function calcSell(tokensIn) {
  if (!_curveState || tokensIn <= 0) return 0;
  const vn = _curveState.nightReserve, vt = _curveState.tokenReserve;
  return vn * tokensIn / (vt + tokensIn);
}

function gradPct() {
  if (!_curveState) return 0;
  return Math.min(100, (_curveState.nightReserve / 85) * 100);
}

// ── Launch curve ───────────────────────────────────────────────
async function launchCurve() {
  if (!nftdData) { toast('Deploy a token first', 'error'); return; }
  const initialTokens  = parseInt(document.getElementById('curve-initial-tokens')?.value || '10000');
  const privacyEnabled = document.getElementById('curve-privacy')?.checked || false;
  if (initialTokens < 100) { toast('Minimum 100 tokens', 'error'); return; }

  toast('Initialising bonding curve…', 'info');
  try {
    await apiPost('/api/nightfun/launch-curve', { tokenAddress: nftdData.address, initialTokens, privacyEnabled });
    _curveState = { tokenAddress: nftdData.address, nightReserve: 1, tokenReserve: initialTokens, privacy: privacyEnabled, graduated: false, createdAt: Date.now() };
    saveCurve();
    toast('✓ Bonding curve live!', 'success');
  } catch {
    _curveState = { tokenAddress: nftdData?.address || 'local', nightReserve: 1, tokenReserve: initialTokens, privacy: privacyEnabled, graduated: false, createdAt: Date.now() };
    saveCurve();
    toast('Curve initialised (simulation mode)', 'info');
  }
  renderCurvePanel();
}

async function buyCurveTokens() {
  const nightIn = parseFloat(document.getElementById('curve-buy-night')?.value || '0');
  if (nightIn <= 0)       { toast('Enter NIGHT amount', 'error'); return; }
  if (!_curveState)       { toast('Launch curve first', 'error'); return; }
  if (_curveState.graduated) { toast('Graduated — trade on zswap', 'info'); return; }

  const tokensOut = calcBuy(nightIn);
  if (tokensOut <= 0) { toast('Insufficient liquidity', 'error'); return; }
  toast(`Buying ${tokensOut.toLocaleString()} tokens…`, 'info');

  try {
    const r = await apiPost('/api/nightfun/buy', { tokenAddress: _curveState.tokenAddress, nightIn, minTokensOut: Math.floor(tokensOut * 0.97) });
    if (r.curve) {
      _curveState.nightReserve = parseFloat(r.curve.nightReserve) / 1e6;
      _curveState.tokenReserve = parseFloat(r.curve.tokenReserve);
      _curveState.graduated = r.curve.graduated;
    }
  } catch {
    _curveState.nightReserve += nightIn;
    _curveState.tokenReserve = Math.max(1, _curveState.tokenReserve - tokensOut);
  }

  saveCurve();
  renderCurvePanel();
  toast(`✓ Bought ${tokensOut.toLocaleString()} $${nftdData?.symbol || 'tokens'}`, 'success');
  awardNightScore('trade');
  if (_curveState.nightReserve >= 85) toast('🎓 Graduation threshold reached!', 'success');
}

async function sellCurveTokens() {
  const tokensIn = parseFloat(document.getElementById('curve-sell-tokens')?.value || '0');
  if (tokensIn <= 0)      { toast('Enter token amount', 'error'); return; }
  if (!_curveState)       { toast('Launch curve first', 'error'); return; }
  if (_curveState.graduated) { toast('Graduated — trade on zswap', 'info'); return; }

  const nightOut = calcSell(tokensIn);
  if (nightOut <= 0) { toast('Insufficient liquidity', 'error'); return; }
  toast(`Selling ${tokensIn.toLocaleString()} tokens…`, 'info');

  try {
    const r = await apiPost('/api/nightfun/sell', { tokenAddress: _curveState.tokenAddress, tokensIn, minNightOut: Math.floor(nightOut * 0.97) });
    if (r.curve) {
      _curveState.nightReserve = parseFloat(r.curve.nightReserve) / 1e6;
      _curveState.tokenReserve = parseFloat(r.curve.tokenReserve);
    }
  } catch {
    _curveState.nightReserve = Math.max(0.000001, _curveState.nightReserve - nightOut);
    _curveState.tokenReserve += tokensIn;
  }

  saveCurve();
  renderCurvePanel();
  toast(`✓ Received ${nightOut.toFixed(4)} tNIGHT`, 'success');
}

// ── Render curve panel ─────────────────────────────────────────
function renderCurvePanel() {
  const wrap = document.getElementById('curve-panel');
  if (!wrap) return;

  if (!_curveState) {
    wrap.innerHTML = `
      <div class="card-title">🌊 Bonding Curve</div>
      <div class="card-sub">Constant-product AMM. Auto-graduates to zswap at 85 tNIGHT.</div>
      <div class="field" style="margin-bottom:12px;">
        <label class="label">Initial tokens in pool</label>
        <input class="input" id="curve-initial-tokens" type="number" value="10000" min="100"/>
      </div>
      <label class="privacy-row" for="curve-privacy">
        <input type="checkbox" id="curve-privacy"/>
        <div>
          <div style="font-size:12px;font-weight:700;">⊘ Privacy mode — ZK-sealed trades</div>
          <div style="font-size:11px;color:var(--muted);margin-top:2px;">Buyers appear as anonymous commitments.</div>
        </div>
      </label>
      <button class="btn btn-primary btn-full" onclick="launchCurve()">🚀 Launch bonding curve</button>`;
    return;
  }

  const price   = _curveState.tokenReserve > 0 ? (_curveState.nightReserve / _curveState.tokenReserve).toFixed(6) : '0';
  const pct     = gradPct().toFixed(1);
  const sym     = nftdData?.symbol || 'TOKEN';

  wrap.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;flex-wrap:wrap;gap:8px;">
      <span class="card-title" style="margin-bottom:0;">🌊 Bonding Curve${_curveState.graduated ? ' · 🎓 Graduated' : ''}</span>
      ${_curveState.privacy ? '<span style="font-size:9px;font-family:var(--mono);background:rgba(124,58,237,.15);color:var(--glow);border:1px solid rgba(124,58,237,.3);padding:2px 8px;border-radius:6px;">⊘ ZK Private</span>' : ''}
    </div>
    <div class="curve-stats">
      <div class="curve-stat"><div class="curve-stat-label">Price</div><div class="curve-stat-val" style="color:var(--cyan);font-size:11px;">${price}<br><span style="font-size:8px;color:var(--muted)">tNIGHT/$${sym}</span></div></div>
      <div class="curve-stat"><div class="curve-stat-label">NIGHT raised</div><div class="curve-stat-val" style="color:var(--green);">${_curveState.nightReserve.toFixed(2)}</div></div>
      <div class="curve-stat"><div class="curve-stat-label">Tokens left</div><div class="curve-stat-val">${Math.round(_curveState.tokenReserve).toLocaleString()}</div></div>
    </div>
    <div style="margin-bottom:4px;font-size:10px;font-family:var(--mono);color:var(--muted);">Graduation progress</div>
    <div class="grad-bar-wrap"><div class="grad-bar" style="width:${pct}%"></div></div>
    <div style="font-size:9px;font-family:var(--mono);color:var(--muted);text-align:right;margin-bottom:16px;margin-top:3px;">${pct}% · graduates at 85 tNIGHT</div>

    ${_curveState.graduated ? `<div style="text-align:center;padding:16px;font-size:13px;color:var(--green);font-weight:700;">🎓 Graduated to zswap DEX</div>` : `
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
      <div>
        <div style="font-size:10px;font-family:var(--mono);color:var(--muted);margin-bottom:6px;text-transform:uppercase;letter-spacing:.8px;">Buy $${sym}</div>
        <div class="trade-row">
          <input class="input" id="curve-buy-night" type="number" placeholder="tNIGHT" min="0.01" step="0.1" oninput="updateBuyPreview()"/>
          <button class="btn btn-green btn-sm" onclick="buyCurveTokens()">Buy</button>
        </div>
        <div id="buy-preview" style="font-size:10px;font-family:var(--mono);color:var(--green);margin-top:4px;min-height:14px;"></div>
      </div>
      <div>
        <div style="font-size:10px;font-family:var(--mono);color:var(--muted);margin-bottom:6px;text-transform:uppercase;letter-spacing:.8px;">Sell $${sym}</div>
        <div class="trade-row">
          <input class="input" id="curve-sell-tokens" type="number" placeholder="tokens" min="1" oninput="updateSellPreview()"/>
          <button class="btn btn-red btn-sm" onclick="sellCurveTokens()">Sell</button>
        </div>
        <div id="sell-preview" style="font-size:10px;font-family:var(--mono);color:var(--red);margin-top:4px;min-height:14px;"></div>
      </div>
    </div>`}`;
}

function updateBuyPreview() {
  const nightIn = parseFloat(document.getElementById('curve-buy-night')?.value || '0');
  const preview = document.getElementById('buy-preview');
  if (!preview) return;
  const out = calcBuy(nightIn);
  preview.textContent = nightIn > 0 && out > 0 ? `≈ ${out.toLocaleString()} $${nftdData?.symbol || 'tokens'}` : '';
}

function updateSellPreview() {
  const tokensIn = parseFloat(document.getElementById('curve-sell-tokens')?.value || '0');
  const preview  = document.getElementById('sell-preview');
  if (!preview) return;
  const out = calcSell(tokensIn);
  preview.textContent = tokensIn > 0 && out > 0 ? `≈ ${out.toFixed(4)} tNIGHT` : '';
}

// ── Night-ID ───────────────────────────────────────────────────
function resolveNightId(address) {
  const e = Object.entries(_nightIdLocal).find(([,v]) => v === address);
  return e ? e[0] : null;
}

async function registerNightId() {
  const raw = (document.getElementById('nightid-input')?.value || '')
    .trim().toLowerCase().replace(/\.night$/, '').replace(/[^a-z0-9-]/g, '').slice(0, 32);
  if (!raw || raw.length < 3) { toast('Name must be 3–32 lowercase chars', 'error'); return; }
  const address = walletState?.address || ('demo-' + Math.random().toString(36).slice(2));
  const full    = raw + '.night';
  if (_nightIdLocal[full] && _nightIdLocal[full] !== address) { toast(`${full} is taken`, 'error'); return; }

  toast(`Registering ${full}…`, 'info');
  try { await apiPost('/api/nightid/register', { name: raw, address }); } catch { /* simulation */ }

  _nightIdLocal[full] = address;
  saveNightId();
  const wrap = document.getElementById('nightid-badge-wrap');
  if (wrap) wrap.innerHTML = `<span style="font-size:12px;font-family:var(--mono);background:rgba(124,58,237,.12);color:var(--glow);border:1px solid rgba(124,58,237,.25);padding:3px 10px;border-radius:8px;">🌙 ${full}</span> <span style="font-size:11px;color:var(--green);">✓ registered</span>`;
  toast(`✓ ${full} registered!`, 'success');
}

// ── Tabs ───────────────────────────────────────────────────────
let _activeTab = 'trending';

function switchTab(tab) {
  _activeTab = tab;
  document.querySelectorAll('.tab').forEach(el => el.classList.remove('active'));
  const active = document.getElementById(`tab-${tab}`);
  if (active) active.classList.add('active');

  const discover = document.getElementById('view-discover');
  const king     = document.getElementById('view-king');
  const create   = document.getElementById('view-create');

  const isDiscover = ['trending','new','graduating'].includes(tab);
  if (discover) discover.style.display = isDiscover ? 'block' : 'none';
  if (king)     king.style.display     = tab === 'king'   ? 'block' : 'none';
  if (create)   create.style.display   = tab === 'create' ? 'block' : 'none';

  if (isDiscover) renderTokenGrid(tab);
}

function joinKothSide(side) {
  if (!walletState.connected) { openModal('ov-wallet'); return; }
  toast(`⚔️ Joined ${side === 'peace' ? 'Peace ☮️' : 'War ⚔️'} — merch store opens`, 'success');
}

// ── Modals ─────────────────────────────────────────────────────
function openModal(id)  { document.getElementById(id)?.classList.add('open'); }
function closeModal(id) { document.getElementById(id)?.classList.remove('open'); }

// ── Toast ──────────────────────────────────────────────────────
function toast(msg, type = 'info') {
  const wrap = document.getElementById('toast-wrap');
  if (!wrap) return;
  const t = document.createElement('div');
  t.className = `toast ${type}`;
  t.textContent = msg;
  wrap.appendChild(t);
  setTimeout(() => t.remove(), 3500);
}

// ── renderAll — called after wallet connect ────────────────────
function renderAll() {
  renderCurvePanel();
}

// ── Night Score ────────────────────────────────────────────────
function loadNightScore() {
  try { return JSON.parse(localStorage.getItem('night_score') || '{"score":0,"hands":0,"zk":0,"tokens":0}'); }
  catch { return { score: 0, hands: 0, zk: 0, tokens: 0 }; }
}
function awardNightScore(type) {
  const ns = loadNightScore();
  if (type === 'token') { ns.tokens = (ns.tokens || 0) + 1; ns.score = (ns.score || 0) + 25; }
  if (type === 'trade') { ns.score = (ns.score || 0) + 3; }
  localStorage.setItem('night_score', JSON.stringify(ns));
  renderNightScoreBadge();
}
function renderNightScoreBadge() {
  const ns  = loadNightScore();
  const el  = document.getElementById('ns-badge');
  if (!el) return;
  el.style.display = 'flex';
  el.textContent = `⭐ Night Score: ${ns.score}`;
}

// ── Init ───────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  updateWalletUI();
  renderNightScoreBadge();
  initTokens();
  switchTab('trending');
  renderCurvePanel();
  if (nftdData) {
    const result = document.getElementById('nf-launch-result');
    if (result) {
      result.style.display = 'block';
      const title = document.getElementById('nf-result-title');
      const addr  = document.getElementById('nf-result-addr');
      const rs    = document.getElementById('nf-rs-supply');
      const sym   = document.getElementById('nf-rs-symbol');
      if (title) title.textContent = `🎉 ${nftdData.name} ($${nftdData.symbol})`;
      if (addr)  addr.textContent  = nftdData.address;
      if (rs)    rs.textContent    = nftdData.supply;
      if (sym)   sym.textContent   = nftdData.symbol;
    }
    nftdShow(nftdData);
  }
});
