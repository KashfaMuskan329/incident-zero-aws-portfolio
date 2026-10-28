'use strict';
// Safe simulation: none of these commands are executed by a shell, browser or AWS.
const $ = id => document.getElementById(id);
const API = (window.INCIDENT_ZERO_CONFIG?.apiBaseUrl || '').trim().replace(/\/$/, '');
const incidents = [
  {id:'upstream',num:'01',label:'502 BAD GATEWAY',subtitle:'UPSTREAM IS SILENT',title:'Nginx can’t reach its upstream.',summary:'Customers see a 502 error. The reverse proxy responds, but the upstream application is unreachable.',root:'The API container crashed and Nginx had no healthy upstream to connect to.',fix:'Inspect the failed container, restore its healthy service configuration and restart only the affected API.',prevent:'Container health checks, startup validation, and actionable upstream error alerts.',steps:[
    {commands:['tail -n 20 error.log','tail -n 20 /var/log/nginx/error.log'],out:'nginx/error.log\nconnect() failed (111: Connection refused) while connecting to upstream\nupstream: http://api:3000/',tip:'Read Nginx error logs: tail -n 20 error.log'},
    {commands:['docker ps','docker ps -a'],out:'CONTAINER    STATUS\nnginx        Up 2h\napi          Exited (1) 2m ago\ndb           Up 2h\n↳ The API is down; infrastructure around it is healthy.',tip:'Check container state: docker ps'},
    {commands:['fix upstream'],out:'✓ Simulation: recovered API service configuration and restarted only api\n✓ nginx upstream: api:3000 reachable',tip:'Apply safe recovery: fix upstream'},
    {commands:['curl /health'],out:'HTTP/1.1 200 OK\n{ "status": "healthy", "upstream": "reachable" }',tip:'Verify health: curl /health'}]},
  {id:'disk',num:'02',label:'DISK FULL',subtitle:'NO SPACE LEFT',title:'The server ran out of space.',summary:'Deployments fail with ENOSPC. Logs and old images may be consuming disk space.',root:'Old application logs exhausted the available filesystem capacity.',fix:'Rotate and archive outdated application logs with retention safeguards; free space without deleting active data.',prevent:'Disk usage alarms, log rotation, and sensible artifact retention.',steps:[
    {commands:['df -h'],out:'Filesystem      Size  Used Avail Use% Mounted on\n/dev/root        30G   30G     0 100% /\n⚠ ENOSPC: No space left on device',tip:'Inspect filesystem capacity: df -h'},
    {commands:['du -sh /var/log/*','docker system df'],out:'/var/log/app/archive  17G\n/var/log/nginx         2G\nOther system files     11G\n↳ Historical logs are the main contributor.',tip:'Identify large files: du -sh /var/log/*'},
    {commands:['fix logs'],out:'✓ Simulation: archived and rotated old logs safely\n✓ Available disk space: 18G\n✓ No application data volume touched',tip:'Rotate old logs safely: fix logs'},
    {commands:['curl /health'],out:'HTTP/1.1 200 OK\n{ "status": "healthy", "disk_free_gb": 18 }',tip:'Verify health: curl /health'}]},
  {id:'ssl',num:'03',label:'SSL EXPIRED',subtitle:'TLS HANDSHAKE FAILED',title:'The certificate has expired.',summary:'Visitors receive a browser privacy warning before they can even reach the app.',root:'Automated certificate renewal stopped running, allowing the server certificate to expire.',fix:'Renew the certificate through the approved process and reload Nginx without affecting application data.',prevent:'Certificate expiry monitoring and regular renewal dry-runs.',steps:[
    {commands:['curl -iv https://app','curl -iv https://example.test'],out:'curl: (60) SSL certificate problem: certificate has expired\nNotAfter=Oct 25 23:59:59 2026 GMT',tip:'Inspect TLS details: curl -Iv https://app'},
    {commands:['systemctl status certbot.timer','openssl s_client -connect app:443'],out:'certbot.timer: inactive (dead)\nLast successful renewal: 90 days ago\n↳ Automated renewal was disabled.',tip:'Check renewal timer: systemctl status certbot.timer'},
    {commands:['fix certificate'],out:'✓ Simulation: renewed certificate, restored renew timer, reloaded Nginx\n✓ New certificate valid',tip:'Repair renewal safely: fix certificate'},
    {commands:['curl /health'],out:'HTTP/2 200 OK\nTLS validation: PASS\n{ "status": "healthy" }',tip:'Verify TLS and app health: curl /health'}]},
  {id:'env',num:'04',label:'MISSING ENV VAR',subtitle:'APP RESTART LOOP',title:'The deployment has missing config.',summary:'The API is repeatedly restarting after a configuration change. The database itself is fine.',root:'MONGO_URI was missing from the API deployment environment, so the process crashed at startup.',fix:'Restore the variable from a secure configuration source and redeploy only the API.',prevent:'Pre-deployment environment validation and secret-management checks.',steps:[
    {commands:['docker ps','docker ps -a','systemctl status api'],out:'api        Restarting (1) every 10 seconds\nnginx      Up 2h\nmongodb    Up 2h\n↳ Investigate the restarting API process.',tip:'Inspect API service health: docker ps'},
    {commands:['docker logs api'],out:'ERROR Missing required environment variable: MONGO_URI\nProcess exited with code 1\n↳ Database was not destroyed; config is missing.',tip:'Read process logs: docker logs api'},
    {commands:['fix env'],out:'✓ Simulation: restored MONGO_URI from secure config source\n✓ Redeployed api container without exposing any secret',tip:'Recover secure config: fix env'},
    {commands:['curl /health'],out:'HTTP/1.1 200 OK\n{ "api": "healthy", "database": "connected" }',tip:'Verify app health: curl /health'}]},
  {id:'pipeline',num:'05',label:'PIPELINE FAILED',subtitle:'DEPLOYMENT BLOCKED',title:'The build pipeline is red.',summary:'A CI/CD job fails just before deployment. The last stable version is still serving traffic.',root:'The deployment job referred to an outdated credential identifier in its configuration.',fix:'Update the reference to the approved credential securely, rerun checks, and deploy only after success.',prevent:'Automated credential validation, protected secrets, and staging release checks.',steps:[
    {commands:['pipeline status'],out:'STAGE           STATUS\ncheckout        PASS\nbuild           PASS\ntest            PASS\ndeploy          FAILED\n↳ The failure is limited to the deploy stage.',tip:'Read the pipeline state: pipeline status'},
    {commands:['pipeline logs'],out:'DEPLOY ERROR: configured credential ID not found\nSecret value is not shown.\n↳ Credential reference mismatch, not a compile failure.',tip:'Inspect deploy job logs: pipeline logs'},
    {commands:['fix credentials'],out:'✓ Simulation: corrected credential reference through secure settings\n✓ No secrets printed or committed',tip:'Fix the reference: fix credentials'},
    {commands:['pipeline rerun'],out:'checkout ✓  build ✓  test ✓  deploy ✓\nPIPELINE STATUS: SUCCESS\nProduction remains healthy.',tip:'Rerun checks: pipeline rerun'}]},
  {id:'iam',num:'06',label:'IAM ACCESS DENIED',subtitle:'PERMISSION BOUNDARY',title:'The deploy role lost S3 access.',summary:'An artifact fetch now fails with AccessDenied. Investigate the caller and the exact denied action before editing permissions.',root:'The deployment role lost its narrowly scoped s3:GetObject permission for a build artifact.',fix:'Restore only the required read permission on the specific artifact prefix after confirming the role and policy review.',prevent:'Policy-as-code review, IAM Access Analyzer, and deployment-role permission tests.',steps:[
    {commands:['aws sts get-caller-identity'],out:'Account: 111122223333 (fictional)\nRole: arn:aws:sts::111122223333:assumed-role/deploy-runner/build\n↳ The deploy runner is the caller, not a personal IAM user.',tip:'Identify the caller: aws sts get-caller-identity'},
    {commands:['aws s3api head-object --bucket demo-assets --key build.json'],out:'An error occurred (403) when calling HeadObject: AccessDenied\nDenied action: s3:GetObject for arn:aws:s3:::demo-assets/build.json\n↳ Read access for one artifact is missing.',tip:'Inspect the failed artifact read: aws s3api head-object --bucket demo-assets --key build.json'},
    {commands:['fix iam'],out:'✓ Simulation: reviewed role policy and restored scoped s3:GetObject permission\n✓ No wildcard admin rights added; no public S3 access enabled',tip:'Apply least-privilege fix: fix iam'},
    {commands:['verify iam'],out:'✓ Deployment role can read approved artifact prefix\n✓ HeadObject: 200 OK\n✓ IAM access recovered without expanding unrelated permissions',tip:'Verify the least-privilege fix: verify iam'}]}

];
const services = {
  github:{name:'GitHub / source control',purpose:'The public repository holds the static site and the separate infrastructure-as-code definition.',check:'Inspect commits, the connected repository branch and deployment-webhook permissions.',failure:'The previous deployed build stays served even if GitHub is temporarily unavailable.'},
  amplify:{name:'AWS Amplify Hosting',purpose:'Deploys the static portfolio and game from GitHub, with HTTPS and global delivery.',check:'Inspect Amplify build logs, branch configuration, build status and domain settings.',failure:'A failed new build should not be presented as a successful deployment.'},
  cdn:{name:'Amplify-managed global CDN',purpose:'Distributes static content close to visitors. CDN functionality is managed by Amplify; no independently managed distribution is claimed.',check:'Inspect Amplify domain, cache behavior, HTTPS and content paths.',failure:'A CDN/hosting issue could prevent loading the site; the separate AWS leaderboard cannot fix hosting.'},
  browser:{name:'Visitor browser',purpose:'Runs the entire incident simulation locally. It never executes the displayed shell commands.',check:'Inspect browser console, static files, network connectivity and the game state.',failure:'If the API is down, the local simulation and scoring remain usable.'},
  api:{name:'Amazon API Gateway HTTP API',purpose:'Routes score, leaderboard and session-ping requests to Lambda; includes CORS and route throttling.',check:'Look at HTTP status codes, configured allowed origin, route mapping, 429s and API metrics.',failure:'Scores cannot be published while the API is unavailable; the browser stays playable.'},
  lambda:{name:'AWS Lambda / Python',purpose:'Validates names and command transcripts, recomputes scores, and handles DynamoDB operations.',check:'Read CloudWatch logs, function permissions and error counts without exposing secrets.',failure:'The Hall of Fame switches to unavailable; local postmortems still render.'},
  db:{name:'Amazon DynamoDB',purpose:'Stores bounded leaderboard records and a session-ping count. Server-side scores are recomputed before writing.',check:'Check table capacity, throttled requests, IAM policy and item keys.',failure:'An unavailable table affects global rankings only, not the local game.'}
};
let scenario=null, stage=0, errors=0, hints=new Set(), events=[], history=[], historyPosition=0, complete=false;
let localBest=null;
// Offline-first achievements and an optional 180-second time trial. Neither claims AWS verification.
const achievementCatalog = [
  {id:'first',icon:'✦',title:'First Responder',detail:'Recover your first incident'},
  {id:'no-hints',icon:'◇',title:'No Hints Used',detail:'Finish an incident with zero hints'},
  {id:'all-six',icon:'✳',title:'All Six Resolved',detail:'Recover all six incident types'},
  {id:'speed',icon:'◷',title:'Speed Run',detail:'Finish a 3-minute time trial before the timer ends'},
  {id:'perfect',icon:'★',title:'Perfect Response',detail:'Finish an incident with 100/100'}
];
let achievementState={unlocked:[],solved:[]};
try {const saved=JSON.parse(localStorage.getItem('incident-zero-achievements')||'null');
  if(saved && Array.isArray(saved.unlocked) && Array.isArray(saved.solved)){
    achievementState.unlocked=saved.unlocked.filter(x=>achievementCatalog.some(a=>a.id===x));
    achievementState.solved=saved.solved.filter(x=>incidents.some(i=>i.id===x));
  }
} catch(_) {}
let timeTrial=false,trialStart=0,trialExpired=false,trialInterval=null;
const SAFE_CHECKS = {
  'docker start api':'A restart is a reasonable recovery attempt, but first establish the cause and validate configuration. No points deducted.',
  'docker logs api':'Docker logs are useful evidence. Continue following the active checkpoint for this scenario.',
  'systemctl status api':'Service status is a useful diagnostic check. Continue the checkpoint sequence.',
  'curl /health':'Health checks are useful. Complete the investigation and recovery steps before final verification.',
  'docker ps':'Container status inspected. Continue with the evidence requested by this checkpoint.',
  'docker ps -a':'Container state inspected. Continue with the active checkpoint.',
  'df -h':'Disk-space check noted. Review the currently active incident evidence.',
  'pipeline status':'Pipeline status is useful. Continue the current checkpoint.',
  'pipeline logs':'Pipeline logs are useful. Continue the current checkpoint.',
  'tail -n 20 error.log':'Log inspection noted. Continue the active checkpoint.',
  'aws sts get-caller-identity':'Caller identity is a useful first check. Follow the active checkpoint.'
};
// Allow meaningful diagnostic commands from any scenario without falsely treating them as dangerous choices.
incidents.forEach(incident=>incident.steps.slice(0,2).forEach(step=>step.commands.forEach(cmd=>{
  if(!SAFE_CHECKS[cmd]) SAFE_CHECKS[cmd]='Valid simulated diagnostic. Continue the active checkpoint to progress.';
})));
function displayTimer(){
  const output=$('timerDisplay'); if(!output)return;
  if(!timeTrial){output.textContent='PRACTICE · NO TIMER';return;}
  if(trialExpired){output.textContent='TIME UP · PRACTICE CONTINUES';return;}
  const time=Math.max(0,180-Math.floor((Date.now()-trialStart)/1000));
  output.textContent=`TIME TRIAL · ${String(Math.floor(time/60)).padStart(2,'0')}:${String(time%60).padStart(2,'0')}`;
  output.classList.toggle('timer-urgent',time<=30);
  if(time===0 && !complete){trialExpired=true;output.textContent='TIME UP · PRACTICE CONTINUES';
    write('◷ Time trial ended. Keep investigating — your practice score still counts; Speed Run badge is not awarded.','log-title');}
}
function recordAchievements(){
  if(!achievementState.solved.includes(scenario.id))achievementState.solved.push(scenario.id);
  const earned=['first'];
  if(hints.size===0)earned.push('no-hints');
  if(achievementState.solved.length===incidents.length)earned.push('all-six');
  if(timeTrial&&!trialExpired&&Date.now()-trialStart<180000)earned.push('speed');
  if(score()===100)earned.push('perfect');
  earned.forEach(id=>{if(!achievementState.unlocked.includes(id))achievementState.unlocked.push(id);});
  try{localStorage.setItem('incident-zero-achievements',JSON.stringify(achievementState));}catch(_){}
  renderAchievements();
  $('earnedBadges').textContent='EARNED THIS RUN · '+earned.map(id=>achievementCatalog.find(a=>a.id===id).title).join('  ·  ');
}
function renderAchievements(){
  const list=$('achievementList');if(!list)return;
  list.replaceChildren(...achievementCatalog.map(a=>{
    const li=document.createElement('li');const unlocked=achievementState.unlocked.includes(a.id);
    li.className=unlocked?'achievement unlocked':'achievement';
    const icon=document.createElement('span');icon.className='achievement-icon';icon.textContent=a.icon;
    const body=document.createElement('span');const title=document.createElement('strong');title.textContent=a.title;
    const detail=document.createElement('small');detail.textContent=a.detail;
    body.append(title,detail);const state=document.createElement('b');state.textContent=unlocked?'UNLOCKED':'LOCKED';
    li.append(icon,body,state);return li;
  }));
  $('solvedCount').textContent=`${achievementState.solved.length} / ${incidents.length} SCENARIOS CLEARED ON THIS BROWSER`;
}

try{const v=JSON.parse(localStorage.getItem('incident-zero-local-best')||'null');if(v && Number.isFinite(v.score))localBest=v;}catch(_){}
function normal(cmd){return String(cmd).trim().toLowerCase().replace(/\s+/g,' ');}
function write(line, className='log-note'){
  const el=document.createElement('div');el.className=className;el.textContent=line;
  $('terminalOutput').appendChild(el);$('terminalOutput').scrollTop=$('terminalOutput').scrollHeight;
}
function score(){return Math.max(0,100-errors*8-hints.size*5);}
function rank(){const s=score();return s>=95?'S':s>=85?'A':s>=70?'B':s>=50?'C':'D';}
function updateUI(){
  $('score').textContent=String(score());$('stageLabel').textContent=`${stage} / 4 CHECKPOINTS`; $('progressFill').style.width=`${stage*25}%`;
  ['INVESTIGATE','DIAGNOSE','APPLY FIX','VERIFY'].forEach((label,i)=>{
    const div=$('checkpoints').children[i];div.className=i<stage?'complete':'';div.textContent=(i<stage?'✓':i===stage?'◉':'○')+' '+label;
  });
  if(scenario){$('intelHint').textContent=complete?'Mission complete. Inspect your postmortem below.':`Checkpoint ${stage+1} hint: ${scenario.steps[Math.min(stage,3)].tip}`;}
}
function startIncident(id){
  scenario=incidents.find(s=>s.id===id);if(!scenario)return;
  stage=0;errors=0;hints=new Set();events=[];history=[];historyPosition=0;complete=false;
  if(trialInterval)clearInterval(trialInterval);
  trialExpired=false;trialStart=Date.now();displayTimer();
  if(timeTrial)trialInterval=setInterval(()=>{if(!complete)displayTimer();},500);

  document.body.classList.remove('sunrise');
  $('terminalOutput').replaceChildren();$('postmortem').hidden=true;$('saveMessage').textContent='';
  document.querySelectorAll('.scenario-btn').forEach(btn=>btn.setAttribute('aria-pressed',String(btn.dataset.id===id)));
  $('currentIncident').textContent=`${scenario.label} / ACTIVE`; $('intelTag').textContent=scenario.subtitle;
  $('intelTitle').textContent=scenario.title;$('intelDesc').textContent=scenario.summary;
  write('╭──────────────────────────────────────────────────────────╮','log-title');
  write(`  INCIDENT ZERO / ${scenario.label} · ${scenario.subtitle}`,'log-title');
  write('╰──────────────────────────────────────────────────────────╯','log-title');
  write('You are on call. All outputs are simulated. Type help for commands.');
  write('GOAL: investigate → diagnose → fix → verify. Start with evidence!');
  updateUI();$('terminalInput').value='';$('terminalInput').focus({preventScroll:true});
}
function revealHint(){if(!scenario||complete)return;const key=stage;if(!hints.has(key)){hints.add(key);events.push('hint');}write('HINT: '+scenario.steps[stage].tip,'log-title');updateUI();}
function processCommand(raw){
  const cmd=normal(raw);if(!cmd)return;history.push(raw);historyPosition=history.length;
  write('incident-zero:~$ '+raw,'log-command');if(!scenario){write('Choose an incident first.');return;}
  // Transcript is used by Lambda to verify scores server-side. Never execute it.
  if(events.length>=45){write('Command limit reached. Choose an incident to start over.','log-bad');return;}
  events.push(cmd);
  if(cmd==='help'){write(`AVAILABLE: help | hint | clear | whoami | architecture | about | skills | projects | contact | resume | certs | sudo hire kashfa\nINCIDENT CLUES: ${scenario.steps.map(s=>s.commands[0]).join(' | ')}\nCommands are simulated, never executed on AWS.`);return;}
  if(cmd==='hint'){events.pop();revealHint();return;}
  if(cmd==='clear'){ $('terminalOutput').replaceChildren();return;}
  if(cmd==='whoami'){write('oncall-engineer / temporary simulation account');return;}
  if(cmd==='architecture'){write('Frontend: GitHub → Amplify Hosting → managed CDN\nLeaderboard: browser → API Gateway → Lambda → DynamoDB\nScroll down to inspect every service.');return;}
  if(cmd==='about'){write('Kashfa Muskan — DevOps & Cloud Engineer | Computer Science undergraduate | AWS + Microsoft Azure.\nProduction experience: CI/CD, Docker, monitoring, and security audits.');return;}
  if(cmd==='skills'){write('AWS · Azure · Terraform · Jenkins · GitHub Actions · Docker · Linux · Nginx · Netdata · Kubernetes labs');return;}
  if(cmd==='projects'){write('01 · Softex CI/CD pipelines (employer work, details only)\n02 · Job Tracker 3-tier AWS/Terraform lab (in progress)\n03 · Jenkins on EC2 lab\n04 · Incident Zero portfolio (live AWS-hosted leaderboard)\nSee index.html#work for details.');return;}
  if(cmd==='contact'){write('Email: kashfamuskan329@gmail.com\nGitHub: github.com/KashfaMuskan329\nLinkedIn: linkedin.com/in/kashfa-m-868908238\nPortfolio: index.html#contact');return;}
  if(cmd==='resume'){write('Public-safe resume: open index.html#contact and select RESUME PDF. No personal phone number is included.');return;}
  if(cmd==='certs'){write('Cisco Networking Certificate\nDocker Essentials\nLinux Fundamentals');return;}
  if(cmd==='sudo hire kashfa'){
    write('✓ Permission granted. Access level: hiring manager ✨\nContact: index.html#contact\nPublic resume: resume.pdf','log-good');
    launchHireCelebration();return;
  }
  if(complete){write('Recovered. See your postmortem and score below.');return;}
  const stepDef=scenario.steps[stage];
  if(stepDef.commands.includes(cmd)){
    write(stepDef.out,'log-good');stage++;if(stage===4){complete=true;finishMission();}else{write('✓ Checkpoint complete. '+['','NEXT: DIAGNOSE THE ROOT CAUSE','NEXT: APPLY A SAFE FIX','NEXT: VERIFY YOUR RECOVERY'][stage],'log-title');}
  }else if(Object.prototype.hasOwnProperty.call(SAFE_CHECKS,cmd)){
    write('ℹ '+SAFE_CHECKS[cmd],'log-note');
  }else{
    errors++;write('This is not a recognized action for the current incident. Try help or hint.','log-bad');
  }
  updateUI();
}
function finishMission(){
  if(trialInterval){clearInterval(trialInterval);trialInterval=null;}
  displayTimer();recordAchievements();
  document.body.classList.add('sunrise');
  write('✓ 07:00 AM · PRODUCTION IS BACK. MORNING HAS ARRIVED.','log-good');
  $('postmortem').hidden=false;$('endRank').textContent=rank();$('endScore').textContent=`${score()} / 100`;
  const messages={S:'Flawless incident response. You followed evidence, protected data and verified recovery.',A:'Excellent troubleshooting. You found the root cause with very little noise.',B:'Solid recovery. A few extra checks, but the service is healthy again.',C:'You recovered the service. Next time, use the logs to narrow the search.',D:'The recovery succeeded. Try again to improve your investigation path.'};
  $('endTitle').textContent='07:00 AM · Production is back.';$('endMessage').textContent=messages[rank()];
  $('rootCause').textContent=scenario.root;$('resolution').textContent=scenario.fix;$('prevention').textContent=scenario.prevent;
  const best={score:score(),incident:scenario.label,date:new Date().toISOString()};
  if(!localBest||best.score>localBest.score){localBest=best;try{localStorage.setItem('incident-zero-local-best',JSON.stringify(best));}catch(_){}}
  renderBest();$('postmortem').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'start'});
}
function renderBest(){if(localBest)$('localBest').textContent=`LOCAL BEST: ${localBest.score} / 100 · ${localBest.incident} (THIS BROWSER)`;}
function setup(){
  const select=$('incidentSelect');
  incidents.forEach(incident=>{let button=document.createElement('button');button.type='button';button.className='scenario-btn';button.dataset.id=incident.id;button.setAttribute('aria-pressed','false');
    for(const [cls,text] of [['scenario-no',incident.num+' / INCIDENT'],['scenario-name',incident.label],['scenario-sub',incident.subtitle]]){let el=document.createElement(cls==='scenario-name'?'strong':cls==='scenario-sub'?'small':'span');el.className=cls;el.textContent=text;button.append(el);}
    button.addEventListener('click',()=>startIncident(incident.id));select.append(button);});
  $('randomIncident').addEventListener('click',()=>startIncident(incidents[Math.floor(Math.random()*incidents.length)].id));
  $('dailyIncident').addEventListener('click',()=>{startIncident(incidents[new Date().getDate()%incidents.length].id);write('TODAY’S INCIDENT / LOCAL CALENDAR DAY · Repeats monthly.','log-title');});
  $('terminalForm').addEventListener('submit',e=>{e.preventDefault();const val=$('terminalInput').value;$('terminalInput').value='';processCommand(val);});
  $('terminalInput').addEventListener('keydown',e=>{if(e.key==='ArrowUp'&&history.length){e.preventDefault();historyPosition=Math.max(0,historyPosition-1);$('terminalInput').value=history[historyPosition];}else if(e.key==='ArrowDown'&&history.length){e.preventDefault();historyPosition=Math.min(history.length,historyPosition+1);$('terminalInput').value=history[historyPosition]||'';}});
  $('hintButton').addEventListener('click',revealHint);
  $('clearButton').addEventListener('click',()=>{$('terminalOutput').replaceChildren();write('Terminal cleared. Incident state retained.');});
  $('replayButton').addEventListener('click',()=>{startIncident(incidents[Math.floor(Math.random()*incidents.length)].id);$('play').scrollIntoView({behavior:'smooth'});});
  $('saveScore').addEventListener('click',saveScore);
  $('refreshBoard').addEventListener('click',loadBoard);
  $('copyResult').addEventListener('click',copyResult);
  $('downloadShareCard').addEventListener('click',downloadShareCard);
  $('timeTrial').addEventListener('click',()=>{
    timeTrial=!timeTrial;
    $('timeTrial').setAttribute('aria-pressed',String(timeTrial));
    $('timeTrial').textContent=timeTrial?'◷ TIME TRIAL ON · RESTARTED':'◷ 3-MINUTE CHALLENGE';
    startIncident(scenario.id);
  });
  renderAchievements();
  document.querySelectorAll('.arch-node').forEach(node=>node.addEventListener('click',()=>{
    document.querySelectorAll('.arch-node').forEach(b=>b.classList.remove('selected'));node.classList.add('selected');const data=services[node.dataset.service];
    $('archName').textContent=data.name;$('archPurpose').textContent=data.purpose;$('archCheck').textContent=data.check;$('archFailure').textContent=data.failure;
  }));
  $('themeToggle').addEventListener('click',()=>{let light=document.body.classList.toggle('light');$('themeToggle').setAttribute('aria-pressed',String(light));$('themeToggle').textContent=light?'☀ DARK MODE':'☾ LIGHT MODE';});
  startIncident(incidents[Math.floor(Math.random()*incidents.length)].id);renderBest();loadBoard();
}
function validName(v){return /^[a-zA-Z0-9 _.-]{2,24}$/.test(v) && !/(?:^|[^a-z])(?:fuck|shit|bitch|asshole)(?:$|[^a-z])/i.test(v);}
async function saveScore(){
  if(!complete){$('saveMessage').textContent='Finish the incident first.';return;}
  const name=$('playerName').value.trim();if(!validName(name)){$('saveMessage').textContent='Choose 2–24 characters: letters, numbers, spaces, _, . or -';return;}
  if(!API){$('saveMessage').textContent=`Your ${score()}/100 score is saved locally. Public leaderboard is not connected yet.`;return;}
  const btn=$('saveScore');btn.disabled=true;btn.textContent='SUBMITTING…';
  try{
    const controller=new AbortController();const timeout=setTimeout(()=>controller.abort(),4500);
    let res;try{res=await fetch(API+'/leaderboard',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({name,incidentId:scenario.id,commands:events}),signal:controller.signal});}finally{clearTimeout(timeout);}
    const data=await res.json().catch(()=>({}));if(!res.ok)throw Error(data.error||`HTTP ${res.status}`);
    $('saveMessage').textContent=`✓ Score ${data.score}/100 verified by AWS Lambda and published. ${data.rank||''}`;await loadBoard();
  }catch(e){$('saveMessage').textContent=`Public submission unavailable (${e.message}). Your personal best is still saved in this browser.`;}
  finally{btn.disabled=false;btn.textContent='SAVE MY SCORE ↗';}
}
async function loadBoard(){
  const rows=$('leaderRows');rows.replaceChildren();
  if(!API){const li=document.createElement('li');li.className='empty';li.textContent='Global leaderboard not connected yet. Launch the AWS backend and set its API URL in config.js. Offline play works now.';rows.append(li);$('leaderState').textContent='AWS API NOT CONNECTED';$('apiBadge').classList.remove('online');return;}
  try{
    const controller=new AbortController();const timeout=setTimeout(()=>controller.abort(),3500);
    let res;try{res=await fetch(API+'/leaderboard',{signal:controller.signal,cache:'no-store'});}finally{clearTimeout(timeout);}
    if(!res.ok)throw Error(`HTTP ${res.status}`);const data=await res.json();
    $('leaderState').textContent='LIVE / AWS DYNAMODB';$('apiBadge').classList.add('online');$('apiBadge').innerHTML='<i></i> GLOBAL RANKING · ONLINE';$('footerBackend').textContent='LEADERBOARD LIVE VIA AWS';
    if(!Array.isArray(data.scores)||!data.scores.length){const li=document.createElement('li');li.className='empty';li.textContent='No scores yet — become the first on the board!';rows.append(li);return;}
    data.scores.slice(0,10).forEach((entry,i)=>{const li=document.createElement('li');const pos=document.createElement('span');pos.textContent=String(i+1).padStart(2,'0');const name=document.createElement('span');name.className='leader-name';name.textContent=String(entry.name);const scoreEl=document.createElement('strong');scoreEl.textContent=String(entry.score)+'/100';li.append(pos,name,scoreEl);rows.append(li);});
  }catch(_){$('leaderState').textContent='OFFLINE / LOCAL GAME AVAILABLE';$('apiBadge').classList.remove('online');$('apiBadge').innerHTML='<i></i> GLOBAL RANKING · OFFLINE';$('footerBackend').textContent='LEADERBOARD OFFLINE · GAME WORKS';const li=document.createElement('li');li.className='empty';li.textContent='AWS leaderboard is unavailable right now. No problem — the entire incident game still works.';rows.append(li);}
}
function launchHireCelebration(){
  if(window.matchMedia('(prefers-reduced-motion: reduce)').matches)return;
  const holder=document.createElement('div');holder.className='hire-confetti';holder.setAttribute('aria-hidden','true');
  for(let i=0;i<20;i++){const piece=document.createElement('i');piece.style.left=`${(i*37)%100}%`;piece.style.setProperty('--delay',`${i*37}ms`);piece.style.setProperty('--turn',`${i*35}deg`);holder.append(piece);}
  document.body.append(holder);holder.addEventListener('animationend',()=>holder.remove(),{once:true});
}
async function copyResult(){
  if(!complete)return;
  const message=`I resolved the ${scenario.label} incident in Kashfa's Incident Zero with rank ${rank()} (${score()}/100)!`;
  try{
    if(navigator.clipboard?.writeText && window.isSecureContext){await navigator.clipboard.writeText(message);}
    else {const element=document.createElement('textarea');element.value=message;element.style.position='fixed';element.style.opacity='0';document.body.append(element);element.select();if(!document.execCommand('copy'))throw Error('Copy unavailable');element.remove();}
    $('copyResult').textContent='✓ COPIED';
  }catch(_){$('copyResult').textContent='SELECT + COPY TEXT';$('shareResultText').hidden=false;$('shareResultText').value=message;$('shareResultText').select();}
}
function downloadShareCard(){
  if(!complete)return;
  const canvas=document.createElement('canvas');canvas.width=1200;canvas.height=630;
  const ctx=canvas.getContext('2d');
  if(!ctx){$('saveMessage').textContent='Image creation unavailable; use COPY RESULT instead.';return;}
  const bg=ctx.createLinearGradient(0,0,1200,630);bg.addColorStop(0,'#100b23');bg.addColorStop(.58,'#322056');bg.addColorStop(1,'#6a3e9a');
  ctx.fillStyle=bg;ctx.fillRect(0,0,1200,630);
  const halo=ctx.createRadialGradient(930,320,5,930,320,440);halo.addColorStop(0,'rgba(219,187,255,.35)');halo.addColorStop(1,'rgba(219,187,255,0)');
  ctx.fillStyle=halo;ctx.fillRect(0,0,1200,630);
  ctx.strokeStyle='rgba(232,209,255,.24)';ctx.lineWidth=2;ctx.beginPath();ctx.arc(935,315,205,0,Math.PI*2);ctx.stroke();
  ctx.beginPath();ctx.arc(935,315,270,0,Math.PI*2);ctx.stroke();
  ctx.fillStyle='#dec3ff';ctx.font='bold 26px sans-serif';ctx.fillText('✳ INCIDENT ZERO',68,95);
  ctx.fillStyle='#c2aedb';ctx.font='20px monospace';ctx.fillText('THE NIGHT SHIFT  /  MISSION COMPLETE',68,142);
  ctx.fillStyle='#ffffff';ctx.font='bold 70px sans-serif';ctx.fillText('INCIDENT',68,262);ctx.fillText('RESOLVED.',68,340);
  ctx.fillStyle='#dfccff';ctx.font='bold 27px sans-serif';ctx.fillText(scenario.label,70,396);
  ctx.font='20px monospace';ctx.fillText(`${score()} / 100  ·  ${timeTrial&&!trialExpired?'3-MINUTE TIME TRIAL':'PRACTICE MODE'}`,70,444);
  ctx.fillStyle='#f5eaff';ctx.font='bold 156px sans-serif';ctx.textAlign='center';ctx.fillText(rank(),936,364);ctx.textAlign='left';
  ctx.fillStyle='#fff';ctx.font='bold 26px sans-serif';ctx.textAlign='center';ctx.fillText('RANK',938,408);ctx.textAlign='left';
  ctx.fillStyle='#d5c2ee';ctx.font='17px sans-serif';ctx.fillText('Kashfa Muskan · DevOps & Cloud Engineer',70,554);
  ctx.font='14px sans-serif';ctx.fillText('Educational simulated incident · Not an AWS certification',70,583);
  const link=document.createElement('a');link.download=`incident-zero-${scenario.id}-rank-${rank()}.png`;link.href=canvas.toDataURL('image/png');
  document.body.append(link);link.click();link.remove();
  $('downloadShareCard').textContent='✓ SAVE ANOTHER CARD';
}
setup();
