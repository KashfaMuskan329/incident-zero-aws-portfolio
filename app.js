'use strict';

// INCIDENT ZERO — dependency-free, original interactive portfolio.
// All incident logs are fictional and do not query or modify live infrastructure.

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
if ($('#year')) $('#year').textContent = String(new Date().getFullYear());

// Mobile navigation.
const navToggle = $('#navToggle');
const siteNav = $('#siteNav');
navToggle.addEventListener('click', () => {
  const open = siteNav.classList.toggle('is-open');
  navToggle.setAttribute('aria-expanded', String(open));
});
$$('.nav-links a').forEach(link => link.addEventListener('click', () => {
  siteNav.classList.remove('is-open');
  navToggle.setAttribute('aria-expanded', 'false');
}));
window.addEventListener('scroll', () => $('#topbar').classList.toggle('scrolled', window.scrollY > 25), { passive: true });

// Scroll-on reveal. Always visible if IntersectionObserver is not supported.
if ('IntersectionObserver' in window) {
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) { entry.target.classList.add('is-visible'); observer.unobserve(entry.target); }
    });
  }, { threshold: .08, rootMargin: '0px 0px -40px 0px' });
  $$('.reveal').forEach(el => observer.observe(el));
} else $$('.reveal').forEach(el => el.classList.add('is-visible'));

// Fine-pointer cursor and ambience. Native cursor always retained for touch and reduced motion.
const finePointer = window.matchMedia('(pointer: fine)').matches;
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
if (finePointer && !reduceMotion) {
  const dot = $('#cursorDot'), ring = $('#cursorRing');
  let cx = -100, cy = -100, rx = -100, ry = -100, initialized = false;
  document.body.classList.add('has-custom-cursor');
  window.addEventListener('pointermove', e => {
    cx = e.clientX; cy = e.clientY;
    if (!initialized) {rx = cx; ry = cy; initialized = true;}
    dot.style.left = `${cx}px`; dot.style.top = `${cy}px`;
    $('#mouseAmbient').style.setProperty('--mouse-x', `${cx}px`);
    $('#mouseAmbient').style.setProperty('--mouse-y', `${cy}px`);
  }, { passive: true });
  function animateCursor() {
    rx += (cx - rx) * .16; ry += (cy - ry) * .16;
    ring.style.left = `${rx}px`; ring.style.top = `${ry}px`;
    requestAnimationFrame(animateCursor);
  }
  animateCursor();
  document.addEventListener('pointerover', e => {
    ring.classList.toggle('cursor-hover', !!e.target.closest('a,button,[role="tab"],.work-card,.orbit-scene'));
  });
  window.addEventListener('blur', () => { ring.style.opacity = '0'; dot.style.opacity = '0'; });
  window.addEventListener('focus', () => { ring.style.opacity = '1'; dot.style.opacity = '1'; });
  const scene = $('#orbitScene');
  scene.addEventListener('pointermove', e => {
    const box = scene.getBoundingClientRect();
    const x = (e.clientX - box.left) / box.width - .5, y = (e.clientY - box.top) / box.height - .5;
    scene.style.setProperty('--px', `${x * 12}deg`); scene.style.setProperty('--py', `${-y * 11}deg`);
  });
  scene.addEventListener('pointerleave', () => {scene.style.setProperty('--px', '0deg'); scene.style.setProperty('--py', '0deg');});
}

// Orbiting tool galaxy: depth-sorted circular bubbles around the globe.
// Motion is purely decorative; each bubble is also a working, accessible link.
(() => {
  const scene = document.querySelector('#orbitScene');
  if (!scene) return;
  const bubbles = Array.from(scene.querySelectorAll('.orbit-skill'));
  let time = 0;
  let lastTime = 0;
  let hovered = false;
  const positions = [
    [-125,-142],[165,-130],[-215,-38],[200,49],[48,-203],
    [-38,186],[213,-126],[-179,125],[-215,-105],[178,112],[-44,-188],[110,183]
  ];
  function layout(t) {
    const w = scene.offsetWidth || 600, h = scene.offsetHeight || 600;
    const scale = Math.min(w / 610, h / 610, 1);
    const radiusFactor = Math.max(.51, scale);
    bubbles.forEach((bubble, i) => {
      const ring = Number(bubble.dataset.orbit || 0);
      const count = bubbles.length;
      const angle = i * Math.PI * 2 / count + (ring % 2 === 0 ? 1 : -1) * t * (.30 - ring * .035);
      const rx = (ring === 0 ? 211 : ring === 1 ? 242 : 185) * radiusFactor;
      const ry = (ring === 0 ? 148 : ring === 1 ? 192 : 217) * radiusFactor;
      const bob = Math.sin(t * 1.75 + i * 1.8) * 8 * scale;
      const x = Math.cos(angle) * rx;
      const y = Math.sin(angle) * ry + bob;
      const depth = Math.sin(angle);
      const size = .84 + (depth + 1) * .11;
      bubble.style.left = `${w/2 + x}px`;
      bubble.style.top = `${h/2 + y}px`;
      bubble.style.transform = `translate(-50%, -50%) scale(${size.toFixed(3)})`;
      bubble.style.zIndex = String(depth > .15 ? 10 : 4);
      bubble.style.opacity = String(depth < -.6 ? .78 : 1);
    });
  }
  bubbles.forEach(bubble => {
    bubble.addEventListener('pointerenter', () => {hovered = true;});
    bubble.addEventListener('pointerleave', () => {hovered = false;});
    bubble.addEventListener('focus', () => {hovered = true;});
    bubble.addEventListener('blur', () => {hovered = false;});
    bubble.addEventListener('click', () => {
      const skill = bubble.dataset.category;
      if (skills[skill]) selectSkill(skill);
    });
  });
  if (reduceMotion) { layout(0);return; }
  function frame(stamp) {
    if (lastTime) time += Math.min((stamp-lastTime)/1000, .05) * (hovered ? 0 : 1);
    lastTime=stamp;
    layout(time);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();

// Interactive tool explorer. Skill entries are grounded in resume and direct user additions.
const skills = {
  cloud: {
    index:'01',caption:'DEPLOYING ACROSS ECOSYSTEMS',title:'CLOUD',subtitle:'PLATFORMS.',
    description:'Working with AWS and Microsoft Azure across compute, networking, identity, storage, monitoring, and cloud infrastructure.',
    tags:['AWS','AZURE','EC2 / VPC','VNets','IAM','CloudWatch'],symbol:'☁',foot:'CLOUD / DEPLOYMENT / CONNECTIVITY'
  },
  iac: {
    index:'02',caption:'REPEATABLE INFRASTRUCTURE',title:'INFRA',subtitle:'AS CODE.',
    description:'Practicing Terraform to provision and manage cloud resources with explicit configurations, variables, and environment-aware decisions.',
    tags:['Terraform','AWS','HCL','Variables','Infrastructure design'],symbol:'◇',foot:'PLAN / APPLY / ITERATE'
  },
  delivery: {
    index:'03',caption:'FROM COMMIT TO DEPLOYMENT',title:'AUTOMATE',subtitle:'DELIVERY.',
    description:'Building CI/CD workflows with GitHub Actions, Jenkins and Azure DevOps; deploying containerized applications with Docker and Docker Compose.',
    tags:['Jenkins','GitHub Actions','Azure DevOps','Docker','Docker Compose','Kubernetes labs'],symbol:'⌘',foot:'BUILD / TEST / DEPLOY'
  },
  ops: {
    index:'04',caption:'OBSERVE, HARDEN, RECOVER',title:'SYSTEM',subtitle:'RELIABILITY.',
    description:'Using Linux, Nginx, Netdata, Portainer, JMeter, CloudWatch and security practices to understand, protect and troubleshoot running systems.',
    tags:['Linux','Nginx','Netdata','Portainer','JMeter','Fail2ban'],symbol:'✳',foot:'MONITOR / TROUBLESHOOT / SECURE'
  }
};
const skillTabs = $$('.expertise-tab');
function selectSkill(key, moveFocus = false) {
  const value = skills[key]; if (!value) return;
  skillTabs.forEach(tab => {
    const active = tab.dataset.skill === key;
    tab.classList.toggle('is-selected', active);
    tab.setAttribute('aria-selected', String(active));
    tab.tabIndex = active ? 0 : -1;
    if (active && moveFocus) tab.focus();
  });
  $('#skill-panel').setAttribute('aria-labelledby', `tab-${key}`);
  $('#skillIndex').textContent = value.index;
  $('#skillCaption').textContent = value.caption;
  $('#skillTitle').innerHTML = `${value.title}<br><em>${value.subtitle}</em>`;
  $('#skillDescription').textContent = value.description;
  $('#skillTags').replaceChildren(...value.tags.map(tag => { const span = document.createElement('span'); span.textContent = tag; return span; }));
  $('#skillSymbol').textContent = value.symbol;
  $('#skillFoot').textContent = value.foot;
}
skillTabs.forEach((tab,index) => {
  tab.addEventListener('click', () => selectSkill(tab.dataset.skill));
  tab.addEventListener('keydown', event => {
    if (!['ArrowDown','ArrowUp','ArrowRight','ArrowLeft','Home','End'].includes(event.key)) return;
    event.preventDefault();
    let next = index;
    if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = skillTabs.length - 1;
    else next = (index + (['ArrowDown','ArrowRight'].includes(event.key) ? 1 : -1) + skillTabs.length) % skillTabs.length;
    selectSkill(skillTabs[next].dataset.skill, true);
  });
});

// Expandable portfolio case studies, accessible without relying on hover.
$$('.work-expand').forEach(button => button.addEventListener('click', () => {
  const content = document.getElementById(button.getAttribute('aria-controls'));
  const expanded = button.getAttribute('aria-expanded') === 'true';
  button.setAttribute('aria-expanded', String(!expanded));
  content.hidden = expanded;
  button.innerHTML = `${expanded ? 'EXPLORE CASE STUDY' : 'CLOSE CASE STUDY'} <span>${expanded ? '↗' : '×'}</span>`;
}));

// 3D hover depth on cards: deliberately subtle to preserve legibility.
if (finePointer && !reduceMotion) {
  $$('.tilt-card').forEach(card => {
    card.addEventListener('pointermove', e => {
      const rect = card.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width - .5) * 4;
      const y = ((e.clientY - rect.top) / rect.height - .5) * -4;
      card.style.transform = `perspective(1100px) rotateY(${x}deg) rotateX(${y}deg) translateY(-3px)`;
    });
    card.addEventListener('pointerleave', () => {card.style.transform = '';});
  });
}

// The playable incident game.
const missions = [
  {label:'FIRST RESPONSE',title:'THE SERVICE IS DOWN.',text:'Users are getting HTTP 502 errors. Before you change anything, what should you investigate first?',
    logs:'$ curl -I https://example.test\nHTTP/1.1 502 BAD GATEWAY\n# An alert reports failed requests at the edge.',
    options:[{text:'Check Nginx error logs for an upstream failure',good:true},{text:'Reboot the entire host immediately',good:false,why:'A reboot can hide useful evidence and disrupt healthy services. Inspect logs before making a disruptive change.'},{text:'Disable the firewall and try again',good:false,why:'There is no evidence that the firewall is responsible. Disabling it would add security risk.'}],hint:'A 502 often means the reverse proxy could not reach its upstream.'},
  {label:'FOLLOW THE LOGS',title:'THE UPSTREAM WON’T ANSWER.',text:'Nginx reports that the upstream connection was refused. Which check narrows the failure most effectively?',
    logs:'$ tail -n 5 /var/log/nginx/error.log\nconnect() failed (111: Connection refused)\nupstream: http://api:3000/\n# Reverse proxy is reachable; upstream API may be down.',
    options:[{text:'Inspect container status with docker ps -a',good:true},{text:'Change the public DNS records',good:false,why:'DNS is already resolving the website. This points to the internal upstream, not public DNS.'},{text:'Increase the web server worker count',good:false,why:'Worker limits do not explain an explicit connection refusal to the API.'}],hint:'Find out whether the application process behind the proxy is running.'},
  {label:'FIND THE ROOT CAUSE',title:'THE API IS RESTARTING.',text:'The API container repeatedly restarts while Nginx and MongoDB are running. What evidence do you want next?',
    logs:'$ docker ps -a\nnginx     Up 3 hours\nmongodb   Up 3 hours\napi       Restarting (1) 9 seconds ago\n# The failing component is now identified.',
    options:[{text:'Read the API container logs',good:true},{text:'Expose MongoDB publicly to test access',good:false,why:'A database should not be exposed publicly without justification; first inspect why the application is crashing.'},{text:'Add another Nginx instance',good:false,why:'Another reverse proxy cannot revive a crashing API container.'}],hint:'The process is restarting — its own logs may explain why.'},
  {label:'RECOVER SAFELY',title:'ONE VARIABLE. BIG OUTAGE.',text:'The API logs show a missing MONGO_URI environment setting after deployment. What is your safest recovery plan?',
    logs:'$ docker logs api --tail 10\nERROR: MONGO_URI environment variable not set\nProcess exiting with code 1\n# Database is running; the app lacks its connection config.',
    options:[{text:'Restore the configuration from the approved secret source, redeploy API, and verify /health',good:true},{text:'Hard-code the database password in public GitHub',good:false,why:'Secrets should never be committed into source control. Restore config securely.'},{text:'Delete the MongoDB data volume and reinstall',good:false,why:'The logs identify missing configuration, not damaged data. Deleting a volume risks data loss.'}],hint:'Fix the missing configuration without exposing secrets, then verify the end-to-end result.'}
];
function shuffleChoices(options) {
  const shuffled = options.slice();
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}
let stage = -1, mistakes = 0, hints = 0, seenWrong = new Set(), hintSeen = new Set(), opener = null;
const gameOverlay = $('#gameOverlay');
const gameDialog = $('.game-dialog');
const gameContent = $('#gameContent');
const gameConsole = $('#gameConsole');
function score() { return Math.max(0, 100 - mistakes * 12 - hints * 5); }
function syncScore() {
  $('#gameScore').textContent = String(score());
  $('#gameRetries').textContent = String(mistakes);
  $('#gameProgress').textContent = `${Math.max(0,Math.min(stage,4))} / 4`;
  $('#gameProgressBar').style.width = `${Math.max(0,Math.min(stage,4))*25}%`;
}
function renderLogs(logText, success=false) {
  gameConsole.replaceChildren();
  logText.split('\n').forEach((line, i) => {
    const div = document.createElement('div');
    div.textContent = line;
    if (line.includes('ERROR') || line.includes('502') || line.includes('Restarting') || line.includes('refused')) div.className='log-error';
    if (line.includes('200 OK') || line.includes('healthy') || success) div.className='log-success';
    gameConsole.appendChild(div);
  });
}
function renderStage() {
  syncScore();
  if (stage >= missions.length) {renderSuccess();return;}
  const mission = missions[stage];
  $('#gameChapter').textContent = `MISSION ${String(stage + 1).padStart(2,'0')} / 04`;
  renderLogs(mission.logs);
  gameContent.replaceChildren();
  const tag = document.createElement('div'); tag.className = 'game-question-tag'; tag.textContent = `STAGE ${stage + 1} / ${mission.label}`;
  const title = document.createElement('h2'); title.id='gameTitle';title.textContent=mission.title;
  const text = document.createElement('p');text.textContent=mission.text;
  const choices = document.createElement('div');choices.className='game-choice-list';
  const feedback = document.createElement('div');feedback.setAttribute('role','status'); feedback.setAttribute('aria-live','polite');
  shuffleChoices(mission.options).forEach((choice,i) => {
    const button = document.createElement('button');button.type='button';button.className='game-choice';
    const label=document.createElement('span');label.textContent=`${String.fromCharCode(65+i)} / ${choice.text}`;
    const arrow=document.createElement('span');arrow.textContent='↗';
    button.append(label,arrow);
    button.addEventListener('click',()=> {
      if (choice.good) {stage++;renderStage();return;}
      const key=`${stage}-${choice.text}`;
      if (!seenWrong.has(key)) {seenWrong.add(key);mistakes++;syncScore();}
      feedback.className='game-feedback'; feedback.textContent=`NOT QUITE. ${choice.why}`;
    });
    choices.appendChild(button);
  });
  const hintButton = document.createElement('button');hintButton.type='button';hintButton.className='game-helper';hintButton.textContent='NEED A HINT? (−5 POINTS)';
  hintButton.addEventListener('click',()=> {
    if (!hintSeen.has(stage)){hintSeen.add(stage);hints++;syncScore();}
    feedback.className='game-feedback hint';feedback.textContent=`HINT: ${mission.hint}`;
    hintButton.textContent='HINT REVEALED';
  });
  gameContent.append(tag,title,text,choices,hintButton,feedback);
}
function renderSuccess() {
  syncScore();
  $('#gameChapter').textContent='MISSION COMPLETE / 04';
  renderLogs('$ docker compose up -d api\n$ curl -s -o /dev/null -w "%{http_code}" https://example.test/health\n200 OK\n✓ API healthy. The incident is resolved.',true);
  const finalScore = score();
  const ending = finalScore >= 95 ? {
    rank:'INCIDENT COMMANDER',title:'FLAWLESS RECOVERY',story:'You diagnosed the incident without any unnecessary changes. Calm, evidence-first and security-conscious: exactly the mindset of a strong on-call engineer.'
  } : finalScore >= 80 ? {
    rank:'RELIABLE RESPONDER',title:'SYSTEMS RESTORED',story:'A small detour did not stop you. You followed the evidence and recovered the API safely. Thoughtful troubleshooting wins.'
  } : finalScore >= 60 ? {
    rank:'RESILIENT PROBLEM-SOLVER',title:'LESSONS LEARNED',story:'You recovered the service after exploring a few risky paths. Your post-incident lesson: verify evidence before changing production.'
  } : {
    rank:'PERSISTENT LEARNER',title:'RECOVERY THROUGH LEARNING',story:'It took experimentation, but you stuck with the incident and restored the service. The next attempt will be faster — every incident teaches something.'
  };
  gameContent.innerHTML=`<div class="game-complete"><span>✳ SYSTEM RECOVERED / MISSION COMPLETE</span><h2 id="gameTitle">${ending.title}.</h2><div class="game-rank">YOUR RANK: ${ending.rank}</div><p>${ending.story}</p><p><strong>Final score: ${finalScore} / 100 · Retries: ${mistakes} · Hints: ${hints}</strong></p><p>A fictional simulation inspired by the investigation and recovery mindset used in DevOps — no real production systems are touched.</p><div class="game-end-actions"><button type="button" id="gamePlayAgain">↺ PLAY AGAIN</button><a href="#work" id="gameProjectsLink">EXPLORE REAL PROJECTS ↗</a><a href="https://github.com/KashfaMuskan329" target="_blank" rel="noopener noreferrer">GITHUB ↗</a></div></div>`;
  $('#gamePlayAgain').addEventListener('click',resetGame);
  $('#gameProjectsLink').addEventListener('click',closeGame);
}

function resetGame() {
  stage=0;mistakes=0;hints=0;seenWrong=new Set();hintSeen=new Set();renderStage();
}
function openGame() {
  opener=document.activeElement;
  gameOverlay.hidden=false;gameOverlay.setAttribute('aria-hidden','false');document.body.classList.add('game-open');
  stage=-1;mistakes=0;hints=0;seenWrong=new Set();hintSeen=new Set();syncScore();
  $('#gameChapter').textContent='BRIEFING / BEGIN';
  renderLogs(missions[0].logs);
  gameContent.innerHTML=`<div class="game-question-tag">YOUR SHIFT STARTS NOW</div><h2 id="gameTitle">THE SERVICE IS DOWN.</h2><p>Users are reporting a 502 error. Investigate logs, identify the root cause, and restore the app. Every decision counts — you can learn and retry.</p><div class="game-choice-list"><button class="game-choice game-start-choice" id="gameStart" type="button"><span>START INVESTIGATION</span><span>↗</span></button></div><p class="game-disclaimer">Educational simulation. No live AWS or employer systems are connected.</p>`;
  $('#gameStart').addEventListener('click',resetGame);
  gameDialog.scrollTop=0;gameDialog.focus();
}
function closeGame(){gameOverlay.hidden=true;gameOverlay.setAttribute('aria-hidden','true');document.body.classList.remove('game-open');if(opener && typeof opener.focus==='function')opener.focus();}
$('#launchGame').addEventListener('click',openGame);
$('#closeGame').addEventListener('click',closeGame);
$('#gameBackdrop').addEventListener('click',closeGame);
$('#gameRestart').addEventListener('click',resetGame);
document.addEventListener('keydown',event=>{
  if(gameOverlay.hidden) return;
  if(event.key==='Escape'){event.preventDefault();closeGame();return;}
  if(event.key==='Tab'){
    const focusable=$$('button:not([disabled]),a[href],[tabindex="0"]',gameDialog).filter(el=>el.getClientRects().length);
    if(!focusable.length)return;
    const first=focusable[0],last=focusable[focusable.length-1];
    if(event.shiftKey && document.activeElement===first){event.preventDefault();last.focus();}
    else if(!event.shiftKey && document.activeElement===last){event.preventDefault();first.focus();}
  }
});


// Story clock: scroll from 03:07 AM to 07:00 AM, not the visitor's real time.
(() => {
  const clock = document.getElementById('heroClock');
  const hero = document.getElementById('home');
  if (!clock || !hero) return;
  let waiting = false;
  function updateStoryClock(){
    waiting = false;
    const progress = Math.min(1, Math.max(0, window.scrollY / Math.max(1, hero.offsetHeight * .8)));
    const minutes = Math.round(187 + progress * 233);
    const h = String(Math.floor(minutes / 60)).padStart(2,'0');
    const m = String(minutes % 60).padStart(2,'0');
    clock.textContent = progress >= 1 ? `● ${h}:${m} AM · RESOLVED / MORNING` : `● ${h}:${m} AM · SEV-1 · 502 UPSTREAM DOWN`;
    clock.classList.toggle('is-resolved',progress >= 1);
  }
  window.addEventListener('scroll', () => {
    if (!waiting){ waiting = true;requestAnimationFrame(updateStoryClock); }
  }, {passive:true});
  updateStoryClock();
})();
