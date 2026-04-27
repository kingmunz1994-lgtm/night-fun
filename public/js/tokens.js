// ── Token discovery — grid + live feed ───────────────────────

const SEED_TOKENS = [
  { id:'1', name:'NightDoge',   symbol:'NDOGE', emoji:'🌙', desc:'The original Midnight meme. ZK woof.', night:42.1, pct:49, buys:312, sells:87, new:false },
  { id:'2', name:'ShadowPepe',  symbol:'SPEPE', emoji:'🐸', desc:'Shielded frog. No one knows you hold it.', night:71.3, pct:84, buys:891, sells:201, new:false, grad:true },
  { id:'3', name:'ZKitty',      symbol:'ZKIT',  emoji:'🐱', desc:'Private cat. Buys are invisible on-chain.', night:18.6, pct:22, buys:143, sells:34, new:true },
  { id:'4', name:'MidnightBull',symbol:'MBULL', emoji:'🐂', desc:'Bullish on Midnight. ZK leveraged vibes.', night:55.4, pct:65, buys:567, sells:123, new:false },
  { id:'5', name:'AnonymousApe',symbol:'ANAPE', emoji:'🦍', desc:'NFT-free ape culture. Totally private buys.', night:9.2,  pct:11, buys:78,  sells:12, new:true },
  { id:'6', name:'DustDevil',   symbol:'DUST',  emoji:'🌪️', desc:'Sweeping the DUST floor. ZK yield farming.', night:33.8, pct:40, buys:289, sells:76, new:false },
  { id:'7', name:'NightShiba',  symbol:'NSHIB', emoji:'🐕', desc:'Shib but you\'re anonymous. Much privacy.', night:61.7, pct:73, buys:744, sells:189, new:false },
  { id:'8', name:'VoidCat',     symbol:'VOID',  emoji:'🖤', desc:'Aesthetic nihilism tokenized. ZK dark energy.', night:4.1, pct:5, buys:31, sells:8, new:true },
  { id:'9', name:'ProofOfDoge', symbol:'POD',   emoji:'✅', desc:'ZK-provably doge. Verify the doge without seeing it.', night:28.4, pct:33, buys:221, sells:58, new:false },
];

const ANON_NAMES = ['0xdead…','phantom_','shadow_','anon_','void_','night_','zk_wallet_'];

let _liveInterval = null;

function initTokens() {
  renderTokenGrid('trending');
  renderLiveFeed();
  startLiveFeed();
}

function renderTokenGrid(mode) {
  const grid = document.getElementById('token-grid');
  if (!grid) return;

  let tokens = [...SEED_TOKENS];
  if (mode === 'new')        tokens = tokens.filter(t => t.new).concat(tokens.filter(t => !t.new));
  if (mode === 'graduating') tokens = tokens.filter(t => t.pct >= 60).sort((a,b) => b.pct - a.pct);
  if (mode === 'trending')   tokens.sort((a,b) => b.buys - a.buys);

  grid.innerHTML = tokens.map(t => `
    <div class="token-card" onclick="openToken('${t.id}')">
      <div class="tc-zk-badge">⊘ ZK</div>
      <div class="tc-emoji">${t.emoji}</div>
      <div class="tc-name">${t.name}</div>
      <div class="tc-symbol">$${t.symbol}</div>
      <div class="tc-desc">${t.desc}</div>
      <div class="tc-stats">
        <span class="tc-stat-green">${t.night.toFixed(1)} tNIGHT</span>
        <span><span style="color:var(--green)">▲${t.buys}</span> / <span style="color:var(--red)">▼${t.sells}</span></span>
      </div>
      <div class="tc-bar-wrap">
        <div class="tc-bar" style="width:${t.pct}%"></div>
      </div>
      <div class="tc-bar-label">${t.pct}% to graduation</div>
    </div>
  `).join('');
}

function openToken(id) {
  const t = SEED_TOKENS.find(x => x.id === id);
  if (!t) return;
  toast(`📈 ${t.name} ($${t.symbol}) — ${t.night.toFixed(1)} tNIGHT raised`, 'info');
}

function renderLiveFeed() {
  const feed = document.getElementById('live-feed');
  if (!feed) return;
  feed.innerHTML = generateFeedItems(8).join('');
}

function generateFeedItems(n) {
  return Array.from({length: n}, () => {
    const t    = SEED_TOKENS[Math.floor(Math.random() * SEED_TOKENS.length)];
    const isBuy = Math.random() > 0.4;
    const amt  = (Math.random() * 4 + 0.1).toFixed(2);
    const anon = ANON_NAMES[Math.floor(Math.random() * ANON_NAMES.length)] + Math.random().toString(36).slice(2, 5);
    const mins = Math.floor(Math.random() * 8) + 1;
    return `
      <div class="live-item">
        <span class="live-anon">${anon}</span>
        <span class="${isBuy ? 'live-buy' : 'live-sell'}">${isBuy ? ' bought' : ' sold'}</span>
        <span class="live-night"> ${amt} tNIGHT of </span>
        <span class="live-sym">$${t.symbol}</span>
        <span class="live-time">${mins}m ago · ⊘ ZK shielded</span>
      </div>`;
  });
}

function startLiveFeed() {
  if (_liveInterval) clearInterval(_liveInterval);
  _liveInterval = setInterval(() => {
    const feed = document.getElementById('live-feed');
    if (!feed) return;
    const newItem = document.createElement('div');
    newItem.innerHTML = generateFeedItems(1)[0];
    const item = newItem.firstElementChild;
    item.style.opacity = '0';
    item.style.transform = 'translateY(-8px)';
    feed.prepend(item);
    requestAnimationFrame(() => {
      item.style.transition = 'all .3s';
      item.style.opacity = '1';
      item.style.transform = 'translateY(0)';
    });
    // Keep feed at max 20 items
    while (feed.children.length > 20) feed.lastChild.remove();

    // Nudge a random token's stats
    const t = SEED_TOKENS[Math.floor(Math.random() * SEED_TOKENS.length)];
    const isBuy = Math.random() > 0.4;
    if (isBuy) { t.buys++; t.night += Math.random() * 0.8 + 0.1; }
    else        { t.sells++; }
    t.pct = Math.min(100, Math.round(t.night / 85 * 100));
  }, 3000);
}
