// ── Token discovery — grid + live feed ───────────────────────
// Loads from API (/api/tokens) with SEED_TOKENS as offline fallback.

const NF_API_BASE = 'http://127.0.0.1:3001';

const SEED_TOKENS = [
  { id:'1', name:'NightDoge',    symbol:'NDOGE', emoji:'🌙', desc:'The original Midnight meme. ZK woof.',         address:'token_1', night:'42.1', pct:49, buys:312, graduated:false },
  { id:'2', name:'ShadowPepe',   symbol:'SPEPE', emoji:'🐸', desc:"Shielded frog. No one knows you hold it.",     address:'token_2', night:'71.3', pct:84, buys:891, graduated:true },
  { id:'3', name:'ZKitty',       symbol:'ZKIT',  emoji:'🐱', desc:'Private cat. Buys are invisible on-chain.',   address:'token_3', night:'18.6', pct:22, buys:143, graduated:false },
  { id:'4', name:'MidnightBull', symbol:'MBULL', emoji:'🐂', desc:'Bullish on Midnight. ZK leveraged vibes.',    address:'token_4', night:'55.4', pct:65, buys:567, graduated:false },
  { id:'5', name:'AnonymousApe', symbol:'ANAPE', emoji:'🦍', desc:'NFT-free ape culture. Totally private buys.', address:'token_5', night:'9.2',  pct:11, buys:78,  graduated:false },
  { id:'6', name:'DustDevil',    symbol:'DDUST', emoji:'🌪️', desc:'Sweeping the DUST floor. ZK yield farming.', address:'token_6', night:'33.8', pct:40, buys:289, graduated:false },
  { id:'7', name:'NightShiba',   symbol:'NSHIB', emoji:'🐕', desc:"Shib but you're anonymous. Much privacy.",    address:'token_7', night:'61.7', pct:73, buys:744, graduated:false },
  { id:'8', name:'VoidCat',      symbol:'VOID',  emoji:'🖤', desc:'Aesthetic nihilism tokenized. ZK dark energy.',address:'token_8', night:'4.1',  pct:5,  buys:31,  graduated:false },
  { id:'9', name:'ProofOfDoge',  symbol:'POD',   emoji:'✅', desc:'ZK-provably doge. Verify without seeing it.', address:'token_9', night:'28.4', pct:33, buys:221, graduated:false },
];

const ANON_NAMES = ['0xdead…','phantom_','shadow_','anon_','void_','night_','zk_wallet_'];

var _liveTokens = [...SEED_TOKENS];
var _liveInterval = null;
var _apiOnline = false;

async function loadTokens() {
  try {
    const r = await fetch(NF_API_BASE + '/api/tokens', { signal: AbortSignal.timeout(3000) });
    if (r.ok) {
      const { tokens } = await r.json();
      if (tokens?.length) { _liveTokens = tokens; _apiOnline = true; }
    }
  } catch { /* use seed tokens */ }
}

function initTokens() {
  loadTokens().then(() => { renderTokenGrid('trending'); renderLiveFeed(); startLiveFeed(); });
}

function renderTokenGrid(mode) {
  const grid = document.getElementById('token-grid');
  if (!grid) return;
  let tokens = [..._liveTokens];
  if (mode === 'new')        tokens.sort((a,b) => (b.createdAt||0) - (a.createdAt||0));
  if (mode === 'graduating') tokens = tokens.filter(t => (t.pct||0) >= 40).sort((a,b) => (b.pct||0) - (a.pct||0));
  if (mode === 'trending')   tokens.sort((a,b) => (b.buys||0) - (a.buys||0));

  grid.innerHTML = tokens.map(t => `
    <div class="token-card" onclick="openTokenModal('${t.id}')">
      <div class="tc-zk-badge">⊘ ZK</div>
      ${t.graduated ? '<div style="position:absolute;top:8px;right:8px;font-size:10px;background:rgba(245,197,24,.15);color:#f5c518;padding:2px 6px;border-radius:4px;">🎓 Grad</div>' : ''}
      <div class="tc-emoji">${t.emoji}</div>
      <div class="tc-name">${t.name}</div>
      <div class="tc-symbol">$${t.symbol}</div>
      <div class="tc-desc">${t.desc}</div>
      <div class="tc-stats">
        <span class="tc-stat-green">${parseFloat(t.night||0).toFixed(1)} tNIGHT</span>
        <span><span style="color:var(--green)">▲${t.buys||0}</span></span>
      </div>
      <div class="tc-bar-wrap"><div class="tc-bar" style="width:${t.pct||0}%"></div></div>
      <div class="tc-bar-label">${t.pct||0}% to graduation</div>
    </div>`).join('');
}

function openTokenModal(id) {
  const t = _liveTokens.find(x => x.id === id);
  if (!t) return;
  if (t.graduated) { toast(`🎓 ${t.name} graduated — trade on ZSwap`, 'info'); return; }
  const modal = document.getElementById('buy-modal');
  if (modal) {
    const nameEl = modal.querySelector('#bm-name');
    const symEl  = modal.querySelector('#bm-symbol');
    const nightEl = modal.querySelector('#bm-night');
    if (nameEl)  nameEl.textContent  = `${t.emoji} ${t.name}`;
    if (symEl)   symEl.textContent   = `$${t.symbol}`;
    if (nightEl) nightEl.textContent = `${parseFloat(t.night||0).toFixed(1)} tNIGHT raised · ${t.pct||0}% to grad`;
    modal._tokenId = id;
    modal.classList.add('open');
  } else {
    const amt = prompt(`Buy ${t.name} ($${t.symbol})\nEnter tNIGHT amount to spend:`);
    if (!amt || isNaN(Number(amt))) return;
    buyToken(t, Number(amt));
  }
}

async function buyToken(t, nightIn) {
  const ws = (typeof nightWallet !== 'undefined') ? nightWallet.getState() : null;
  if (!ws?.connected) { toast('Connect wallet first', 'error'); return; }
  toast(`Buying ${t.name} with ${nightIn} tNIGHT…`, 'info');
  try {
    const r = await fetch(NF_API_BASE + '/api/nightfun/buy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tokenAddress: t.address, nightIn }),
      signal: AbortSignal.timeout(10000),
    });
    const data = await r.json();
    if (!r.ok) throw new Error(data.error || 'Buy failed');
    const tokensOut = (Number(data.tokensOut) / 1_000_000).toFixed(2);
    toast(`✓ Bought ${tokensOut} ${t.symbol}${data.graduated ? ' — 🎓 GRADUATED!' : ''}`, 'success');
    if (typeof awardNightScore === 'function') awardNightScore('trade');
    await loadTokens();
    renderTokenGrid('trending');
  } catch (err) {
    toast(`Buy failed: ${err.message}`, 'error');
  }
}

async function confirmBuy() {
  const modal = document.getElementById('buy-modal');
  const id = modal?._tokenId;
  const t = _liveTokens.find(x => x.id === id);
  if (!t) return;
  const amount = parseFloat(document.getElementById('bm-amount')?.value || '0');
  if (!amount || amount <= 0) { toast('Enter amount', 'error'); return; }
  modal.classList.remove('open');
  await buyToken(t, amount);
}

function renderLiveFeed() {
  const feed = document.getElementById('live-feed');
  if (!feed) return;
  feed.innerHTML = _genFeedItems(8).join('');
}

function _genFeedItems(n) {
  return Array.from({ length: n }, () => {
    const t     = _liveTokens[Math.floor(Math.random() * _liveTokens.length)];
    const isBuy = Math.random() > 0.4;
    const amt   = (Math.random() * 4 + 0.1).toFixed(2);
    const anon  = ANON_NAMES[Math.floor(Math.random() * ANON_NAMES.length)] + Math.random().toString(36).slice(2, 5);
    const mins  = Math.floor(Math.random() * 8) + 1;
    return `<div class="live-item">
      <span class="live-anon">${anon}</span>
      <span class="${isBuy ? 'live-buy' : 'live-sell'}">${isBuy ? ' bought' : ' sold'}</span>
      <span class="live-night"> ${amt} tNIGHT of </span>
      <span class="live-sym">$${t?.symbol||'NIGHT'}</span>
      <span class="live-time">${mins}m ago · ⊘ ZK shielded</span>
    </div>`;
  });
}

function startLiveFeed() {
  if (_liveInterval) clearInterval(_liveInterval);
  _liveInterval = setInterval(() => {
    const feed = document.getElementById('live-feed');
    if (!feed) return;
    const wrap = document.createElement('div');
    wrap.innerHTML = _genFeedItems(1)[0];
    const item = wrap.firstElementChild;
    item.style.opacity = '0'; item.style.transform = 'translateY(-8px)';
    feed.prepend(item);
    requestAnimationFrame(() => { item.style.transition = 'all .3s'; item.style.opacity = '1'; item.style.transform = 'translateY(0)'; });
    while (feed.children.length > 20) feed.lastChild.remove();
  }, 3000);
}
