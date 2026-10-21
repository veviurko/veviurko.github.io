document.querySelectorAll('.rl-replay').forEach(figure => {
 const play = figure.querySelector('.replay-play'), range = figure.querySelector('input');
 let frames, pending, playing = false, animation, position = 0, previous;
 async function load() {
  if (!pending) pending = fetch(figure.dataset.motion).then(r => { if (!r.ok) throw Error('Could not load animation'); return r.json(); });
  frames = await pending;
  range.max = frames.length - 1;
 }
 function render() {
  const i = Math.floor(position), a = frames[i], b = frames[Math.min(i+1, frames.length-1)], mix = position-i;
  const interpolate = (p, q) => p.map((v,j) => v+(q[j]-v)*mix);
  const set = (element, p) => {element.setAttribute('cx',p[0]);element.setAttribute('cy',p[1]);};
  const agent = interpolate(a.agent,b.agent);
  set(figure.querySelector('.replay-agent'),agent);
  set(figure.querySelector('.replay-goal'),interpolate(a.goal,b.goal));
  figure.querySelectorAll('[data-obstacle]').forEach((circle,j) => {
   const p = interpolate(a.obstacles[j],b.obstacles[j]);set(circle,p);circle.setAttribute('r',p[2]);
  });
  figure.querySelector('.replay-trail').setAttribute('points',frames.slice(Math.max(0,i-20),i+1).map(f=>f.agent.join(',')).concat([agent.join(',')]).join(' '));
  figure.querySelector('.replay-time').textContent = (position*.2).toFixed(1)+' s';
  range.value = position;
 }
 function pause() {playing=false;cancelAnimationFrame(animation);previous=undefined;play.textContent='Play';play.setAttribute('aria-pressed','false');}
 function tick(now) {
  if (!playing) return;
  if (previous!==undefined) position=Math.min(frames.length-1,position+Math.min(now-previous,100)/200);
  previous=now;render();
  if(position>=frames.length-1) pause(); else animation=requestAnimationFrame(tick);
 }
 play.addEventListener('click',async()=>{
  if(playing){pause();return;}
  play.disabled=true;
  try{await load();if(position>=frames.length-1)position=0;playing=true;previous=undefined;play.textContent='Pause';play.setAttribute('aria-pressed','true');animation=requestAnimationFrame(tick);}
  catch{pending=null;play.textContent='Retry';}finally{play.disabled=false;}
 });
 range.addEventListener('input',async()=>{pause();position=Number(range.value);try{await load();render();}catch{pending=null;play.textContent='Retry';}});
 figure.querySelector('.replay-reset').addEventListener('click',async()=>{pause();position=0;try{await load();render();}catch{pending=null;play.textContent='Retry';}});
 document.addEventListener('visibilitychange',()=>{if(document.hidden)pause();});
});
