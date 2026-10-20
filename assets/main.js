document.querySelectorAll('.rl-replay').forEach(figure => {
 const play = figure.querySelector('.replay-play'), range = figure.querySelector('input');
 let frames, pending, playing = false, timer;
 async function load() {
  if (!pending) pending = fetch(figure.dataset.motion).then(r => { if (!r.ok) throw Error('Could not load animation'); return r.json(); });
  frames = await pending;
 }
 function render() {
  const i = Number(range.value), frame = frames[i];
  const set = (element, p) => { element.setAttribute('cx', p[0]); element.setAttribute('cy', p[1]); };
  set(figure.querySelector('.replay-agent'), frame.agent);
  set(figure.querySelector('.replay-goal'), frame.goal);
  figure.querySelectorAll('[data-obstacle]').forEach((circle, j) => {set(circle, frame.obstacles[j]);circle.setAttribute('r',frame.obstacles[j][2]);});
  figure.querySelector('.replay-time').textContent = (i * .2).toFixed(1) + ' s';
 }
 function pause() { playing = false; clearInterval(timer); play.textContent='Play';play.setAttribute('aria-pressed','false'); }
 play.addEventListener('click', async () => {
  if (playing) {pause();return;}
  play.disabled=true;
  try {await load();if (+range.value===249) range.value=0;playing=true;play.textContent='Pause';play.setAttribute('aria-pressed','true');
   timer=setInterval(()=>{range.value=Number(range.value)+1;render();if(+range.value===249)pause();},100);
  } catch {pending=null;play.textContent='Retry';} finally {play.disabled=false;}
 });
 range.addEventListener('input',async()=>{pause();try{await load();render();}catch{play.textContent='Retry';}});
 figure.querySelector('.replay-reset').addEventListener('click',async()=>{pause();range.value=0;try{await load();render();}catch{play.textContent='Retry';}});
 document.addEventListener('visibilitychange',()=>{if(document.hidden)pause();});
});
