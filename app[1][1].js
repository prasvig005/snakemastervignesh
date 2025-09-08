// Friends‑style Snake Game (PWA-ready) with obstacles, power-ups and speed boosts.
// Background music is generated with WebAudio (procedural) to avoid copyrighted tracks.
// You can replace audio by allowing file upload in the UI if desired.

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const startBtn = document.getElementById('startBtn');
const pauseBtn = document.getElementById('pauseBtn');
const muteBtn = document.getElementById('muteBtn');
const difficulty = document.getElementById('difficulty');
const scoreEl = document.getElementById('score');
const highEl = document.getElementById('high');
const speedEl = document.getElementById('speed');
const powerEl = document.getElementById('power');

const TILE = 20;
const COLS = canvas.width / TILE;
const ROWS = canvas.height / TILE;

let snake, dir, food, obstacles, powerUps, score, highScore, running, gameInterval, baseSpeed;
let speedMultiplier = 1;
let activePower = null;
let audioCtx, masterGain, musicOn = true, musicPlaying = false;

function init() {
  snake = [{x:Math.floor(COLS/2), y:Math.floor(ROWS/2)}];
  dir = {x:1,y:0};
  spawnFood();
  obstacles = [];
  powerUps = [];
  score = 0;
  highScore = Number(localStorage.getItem('fsg_high')||0);
  scoreEl.textContent = score;
  highEl.textContent = highScore;
  baseSpeed = Number(difficulty.value);
  speedMultiplier = 1;
  speedEl.textContent = speedMultiplier.toFixed(1) + 'x';
  activePower = '—';
  powerEl.textContent = activePower;
  spawnObstacles(6);
  running = false;
  draw();
}

function spawnFood(){
  food = randEmpty();
  food.type = 'food';
}

function spawnObstacles(n){
  for(let i=0;i<n;i++){
    const o = randEmpty();
    o.type = 'obstacle';
    obstacles.push(o);
  }
}

function spawnPowerUp(){
  const p = randEmpty();
  p.type = 'power';
  // types: score (extra points), speed (boost), slow (slow time), shield (temporary immunity)
  const types = ['score','speed','slow','shield'];
  p.effect = types[Math.floor(Math.random()*types.length)];
  powerUps.push(p);
  // auto-remove after 10s if not picked
  setTimeout(()=>{
    const idx = powerUps.indexOf(p);
    if(idx>-1) powerUps.splice(idx,1);
  }, 10000);
}

function randEmpty(){
  while(true){
    const pos = {x:Math.floor(Math.random()*COLS), y:Math.floor(Math.random()*ROWS)};
    if(!collidesWith(pos, snake) && !collidesWith(pos, obstacles) && !(food && pos.x===food.x && pos.y===food.y) && !collidesWith(pos, powerUps)) return pos;
  }
}

function collidesWith(pos, arr){
  return arr.some(a => a.x===pos.x && a.y===pos.y);
}

function drawGrid(){
  ctx.clearRect(0,0,canvas.width,canvas.height);
  ctx.save();
  ctx.globalAlpha = 0.06;
  for(let x=0;x<COLS;x++){
    for(let y=0;y<ROWS;y++){
      if((x+y)%2===0){
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(x*TILE, y*TILE, TILE, TILE);
      }
    }
  }
  ctx.restore();
}

function draw(){
  drawGrid();
  // obstacles
  obstacles.forEach(o=>{
    ctx.fillStyle = '#666';
    roundRect(ctx, o.x*TILE+2, o.y*TILE+2, TILE-4, TILE-4, 6);
  });
  // powerups
  powerUps.forEach(p=>{
    ctx.fillStyle = p.effect==='score' ? '#ffcf5c' : p.effect==='speed' ? '#73d1ff' : p.effect==='slow' ? '#b39cff' : '#73ff9b';
    ctx.beginPath();
    ctx.arc(p.x*TILE+TILE/2, p.y*TILE+TILE/2, TILE/2-4,0,Math.PI*2);
    ctx.fill();
  });
  // food
  ctx.fillStyle = '#ff4d4d';
  ctx.beginPath();
  ctx.arc(food.x*TILE+TILE/2, food.y*TILE+TILE/2, TILE/2-2,0,Math.PI*2);
  ctx.fill();
  // snake
  snake.forEach((s,i)=>{
    ctx.fillStyle = i===0 ? '#222' : '#444';
    roundRect(ctx, s.x*TILE+2, s.y*TILE+2, TILE-4, TILE-4, 6);
  });
}

function roundRect(ctx, x, y, w, h, r){
  ctx.beginPath();
  ctx.moveTo(x+r, y);
  ctx.arcTo(x+w, y, x+w, y+h, r);
  ctx.arcTo(x+w, y+h, x, y+h, r);
  ctx.arcTo(x, y+h, x, y, r);
  ctx.arcTo(x, y, x+w, y, r);
  ctx.closePath();
  ctx.fill();
}

function step(){
  const head = {x: snake[0].x + dir.x, y: snake[0].y + dir.y};
  // wrap around
  head.x = (head.x + COLS) % COLS;
  head.y = (head.y + ROWS) % ROWS;
  // collisions with self or obstacle
  if(collidesWith(head, snake) || collidesWith(head, obstacles)){
    if(activePower==='shield'){ // consume shield and continue
      activePower = '—';
      powerEl.textContent = activePower;
      // remove shield but don't end
    } else {
      gameOver();
      return;
    }
  }
  snake.unshift(head);

  // eat food?
  if(head.x===food.x && head.y===food.y){
    score += 10;
    scoreEl.textContent = score;
    spawnFood();
    // small chance to spawn powerup
    if(Math.random()<0.35) spawnPowerUp();
    // occasionally add obstacle
    if(Math.random()<0.25) spawnObstacles(1);
  } else {
    snake.pop();
  }

  // pick powerup
  for(let i=0;i<powerUps.length;i++){
    const p = powerUps[i];
    if(p.x===head.x && p.y===head.y){
      applyPower(p.effect);
      powerUps.splice(i,1);
      break;
    }
  }

  draw();
}

function applyPower(effect){
  activePower = effect;
  powerEl.textContent = effect;
  if(effect==='score'){
    score += 30;
    scoreEl.textContent = score;
    setTimeout(()=>{ activePower='—'; powerEl.textContent=activePower }, 5000);
  } else if(effect==='speed'){
    speedMultiplier = 2.0;
    speedEl.textContent = speedMultiplier.toFixed(1) + 'x';
    setTimeout(()=>{ speedMultiplier = 1; speedEl.textContent = speedMultiplier.toFixed(1)+'x'; activePower='—'; powerEl.textContent=activePower }, 6000);
  } else if(effect==='slow'){
    speedMultiplier = 0.5;
    speedEl.textContent = speedMultiplier.toFixed(1) + 'x';
    setTimeout(()=>{ speedMultiplier = 1; speedEl.textContent = speedMultiplier.toFixed(1)+'x'; activePower='—'; powerEl.textContent=activePower }, 6000);
  } else if(effect==='shield'){
    // shield lasts through next collision
    setTimeout(()=>{ activePower='—'; powerEl.textContent=activePower }, 10000);
  }
}

function gameOver(){
  running = false;
  clearInterval(gameInterval);
  if(score>highScore){
    localStorage.setItem('fsg_high', score);
    highEl.textContent = score;
  }
  alert('Game Over — Score: '+score);
  init();
}

// controls
document.addEventListener('keydown', e=>{
  if(e.key==='ArrowUp' && dir.y!==1) dir = {x:0,y:-1};
  if(e.key==='ArrowDown' && dir.y!==-1) dir = {x:0,y:1};
  if(e.key==='ArrowLeft' && dir.x!==1) dir = {x:-1,y:0};
  if(e.key==='ArrowRight' && dir.x!==-1) dir = {x:1,y:0};
  if(e.key===' '){ // space to pause
    togglePause();
  }
});

startBtn.addEventListener('click', ()=>{
  if(running) return;
  running = true;
  startGameLoop();
  startMusic();
});
pauseBtn.addEventListener('click', togglePause);
muteBtn.addEventListener('click', ()=>{
  musicOn = !musicOn;
  if(masterGain) masterGain.gain.value = musicOn ? 0.12 : 0;
  muteBtn.textContent = musicOn ? 'Mute Music' : 'Unmute Music';
});

difficulty.addEventListener('change', ()=>{
  baseSpeed = Number(difficulty.value);
  if(running){
    clearInterval(gameInterval);
    startGameLoop();
  }
});

function startGameLoop(){
  const interval = Math.max(30, 200 - baseSpeed*8);
  gameInterval = setInterval(()=>{
    step();
    // occasionally spawn powerups
    if(Math.random()<0.08) spawnPowerUp();
  }, interval / Math.max(0.2, speedMultiplier));
}

function togglePause(){
  if(!running) return;
  if(gameInterval){
    clearInterval(gameInterval);
    gameInterval = null;
  } else {
    startGameLoop();
  }
}

function startMusic(){
  if(musicPlaying) return;
  try{
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    masterGain = audioCtx.createGain();
    masterGain.gain.value = musicOn ? 0.12 : 0;
    masterGain.connect(audioCtx.destination);
    // simple chord arpeggio + bass
    const now = audioCtx.currentTime;
    const chord = [0,4,7]; // major triad
    const bpm = 78;
    const beat = 60/bpm;
    for(let i=0;i<32;i++){
      const t = now + i*beat*0.5;
      chord.forEach((n, idx)=>{
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = idx===0 ? 'sawtooth' : 'sine';
        osc.frequency.value = 220 * Math.pow(2, n/12) * Math.pow(2, Math.floor(i/8));
        gain.gain.value = 0.02;
        osc.connect(gain);
        gain.connect(masterGain);
        osc.start(t);
        osc.stop(t + 0.25);
      });
    }
    musicPlaying = true;
    // keep a gentle looping background
    const loop = ()=>{
      if(!musicPlaying) return;
      // schedule next batch
      startMusic();
    };
    setTimeout(loop, 4000);
  }catch(e){
    console.warn('Audio start failed', e);
  }
}

// register service worker for PWA
if('serviceWorker' in navigator){
  navigator.serviceWorker.register('service-worker.js').catch(err=>console.warn('SW register failed', err));
}

// show initial UI state
init();
