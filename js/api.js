// ── Night Fun API layer ───────────────────────────────────────
// Points to local api-server when running locally.
// Replace NF_API with hosted URL once deployed.

var NF_API = 'http://127.0.0.1:3001';
var _apiReady = null;

async function apiCheck() {
  if (_apiReady !== null) return _apiReady;
  try {
    const r = await fetch(NF_API + '/api/status', { signal: AbortSignal.timeout(2000) });
    const j = await r.json();
    _apiReady = j.ready === true;
  } catch { _apiReady = false; }
  return _apiReady;
}

async function apiPost(path, body) {
  const r = await fetch(NF_API + path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(120000),
  });
  const j = await r.json();
  if (!r.ok) throw new Error(j.error || 'API error ' + r.status);
  return j;
}

async function apiGet(path) {
  const r = await fetch(NF_API + path, { signal: AbortSignal.timeout(10000) });
  const j = await r.json();
  if (!r.ok) throw new Error(j.error || 'API error ' + r.status);
  return j;
}
