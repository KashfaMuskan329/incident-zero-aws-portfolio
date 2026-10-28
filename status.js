/* AWS badges are deliberately factual. Never pretend that simulated metrics are live. */
(async function () {
  const date = document.getElementById('deployDate');
  const visits = document.getElementById('liveVisits');
  const backend = document.getElementById('backendStatus');
  const deployed = document.getElementById('deploymentStatus');
  try {
    const r = await fetch('./site-meta.json', {cache:'no-store'});
    if(r.ok) {
      const data = await r.json();
      if(data.deployedAt && location.protocol==='https:') {
        date.textContent = 'LAST BUILT: ' + new Date(data.deployedAt).toLocaleString();
        if (location.hostname.endsWith('.amplifyapp.com')) deployed.textContent='HOSTED ON AWS AMPLIFY';
      }
    }
  } catch (_) {}
  const base = (window.INCIDENT_ZERO_CONFIG?.apiBaseUrl || '').replace(/\/$/, '');
  if (!base) return;
  try {
    const abort = new AbortController();
    const timeout = setTimeout(()=>abort.abort(), 2500);
    let res; try {res = await fetch(base+'/status',{signal:abort.signal,cache:'no-store'});} finally {clearTimeout(timeout);}
    if (!res.ok) throw new Error('API error');
    const data=await res.json();
    backend.textContent='LEADERBOARD API: ONLINE';
    visits.textContent='SESSION PINGS: '+Number(data.sessionPings || 0).toLocaleString();
    if (!sessionStorage.getItem('incident-zero-visit')) {
      sessionStorage.setItem('incident-zero-visit','attempted');
      fetch(base+'/visits',{method:'POST',headers:{'content-type':'application/json'},body:'{}'}).catch(()=>{});
    }
  } catch(_){backend.textContent='LEADERBOARD API: OFFLINE · GAME STILL WORKS';}
})();
