const board = document.getElementById("board");
const ctx = board.getContext("2d");
const scoreValueEl = document.getElementById("scoreValue");
const livesEl = document.getElementById("livesEl");
const flashEl = document.getElementById("flash");
const resultEl = document.getElementById("result");
const resultTitleEl = document.getElementById("resultTitle");
const resultTextEl = document.getElementById("resultText");
const restartBtn = document.getElementById("restartBtn");

const W = board.width;
const H = board.height;

const PLAYER_W = 30;
const PLAYER_H = 34;
const BULLET_INTERVAL = 280;
const ENEMY_SPAWN_BASE = 900;
const INVINCIBLE_TIME = 1400;
const MAX_LIVES = 3;

let player, bullets, enemies, score, lives, over, invincibleUntil;
let lastBulletTime, lastSpawnTime, lastFrameTime, rafId;
let pointerActive = false;

function resetState() {
  player = { x: W / 2, y: H - 60 };
  bullets = [];
  enemies = [];
  score = 0;
  lives = MAX_LIVES;
  over = false;
  invincibleUntil = 0;
  lastBulletTime = 0;
  lastSpawnTime = 0;
  lastFrameTime = 0;

  scoreValueEl.textContent = "0";
  document.querySelectorAll(".heart").forEach((h) => h.classList.remove("lost"));
  resultEl.classList.add("hidden");
  flashEl.classList.remove("active");
}

function clampPlayer() {
  const halfW = PLAYER_W / 2;
  player.x = Math.max(halfW, Math.min(W - halfW, player.x));
  player.y = Math.max(PLAYER_H / 2, Math.min(H - PLAYER_H / 2, player.y));
}

function canvasPointFromEvent(e) {
  const rect = board.getBoundingClientRect();
  const scaleX = W / rect.width;
  const scaleY = H / rect.height;
  return {
    x: (e.clientX - rect.left) * scaleX,
    y: (e.clientY - rect.top) * scaleY,
  };
}

function onPointerDown(e) {
  if (over) return;
  pointerActive = true;
  const p = canvasPointFromEvent(e);
  player.x = p.x;
  player.y = p.y;
  clampPlayer();
}

function onPointerMove(e) {
  if (!pointerActive || over) return;
  const p = canvasPointFromEvent(e);
  player.x = p.x;
  player.y = p.y;
  clampPlayer();
}

function onPointerUp() {
  pointerActive = false;
}

function rectsOverlap(a, b) {
  return (
    a.x - a.w / 2 < b.x + b.w / 2 &&
    a.x + a.w / 2 > b.x - b.w / 2 &&
    a.y - a.h / 2 < b.y + b.h / 2 &&
    a.y + a.h / 2 > b.y - b.h / 2
  );
}

function spawnEnemy() {
  const w = 26 + Math.random() * 10;
  const speed = 2 + Math.random() * 1.5 + Math.min(score / 300, 2);
  enemies.push({
    x: w / 2 + Math.random() * (W - w),
    y: -30,
    w,
    h: w,
    vy: speed,
  });
}

function fireBullet() {
  bullets.push({ x: player.x, y: player.y - PLAYER_H / 2, w: 4, h: 12, vy: -7 });
}

function loseLife() {
  lives -= 1;
  const heart = livesEl.querySelector(`.heart[data-i="${lives}"]`);
  if (heart) heart.classList.add("lost");

  flashEl.classList.add("active");
  setTimeout(() => flashEl.classList.remove("active"), 150);

  invincibleUntil = performance.now() + INVINCIBLE_TIME;

  if (lives <= 0) {
    endGame();
  }
}

function endGame() {
  over = true;
  cancelAnimationFrame(rafId);
  resultTitleEl.textContent = "GAME OVER";
  resultTextEl.textContent = `최종 점수: ${score}`;
  resultEl.classList.remove("hidden");
}

function update(dt, now) {
  if (now - lastBulletTime > BULLET_INTERVAL) {
    fireBullet();
    lastBulletTime = now;
  }

  const spawnInterval = Math.max(350, ENEMY_SPAWN_BASE - score / 5);
  if (now - lastSpawnTime > spawnInterval) {
    spawnEnemy();
    lastSpawnTime = now;
  }

  bullets.forEach((b) => (b.y += b.vy));
  bullets = bullets.filter((b) => b.y + b.h > 0);

  enemies.forEach((en) => (en.y += en.vy));
  enemies = enemies.filter((en) => en.y - en.h / 2 < H + 20);

  outer: for (const en of enemies) {
    for (const b of bullets) {
      if (rectsOverlap(en, { x: b.x, y: b.y, w: b.w, h: b.h })) {
        en.dead = true;
        b.dead = true;
        score += 10;
        scoreValueEl.textContent = score;
        continue outer;
      }
    }
  }
  bullets = bullets.filter((b) => !b.dead);
  enemies = enemies.filter((en) => !en.dead);

  if (now >= invincibleUntil) {
    const playerBox = { x: player.x, y: player.y, w: PLAYER_W * 0.7, h: PLAYER_H * 0.7 };
    for (const en of enemies) {
      if (rectsOverlap(en, playerBox)) {
        en.dead = true;
        loseLife();
        break;
      }
    }
    enemies = enemies.filter((en) => !en.dead);
  }
}

function drawPlayer() {
  const flashing = performance.now() < invincibleUntil && Math.floor(performance.now() / 100) % 2 === 0;
  if (flashing) return;

  ctx.fillStyle = "#4cc9f0";
  ctx.beginPath();
  ctx.moveTo(player.x, player.y - PLAYER_H / 2);
  ctx.lineTo(player.x - PLAYER_W / 2, player.y + PLAYER_H / 2);
  ctx.lineTo(player.x, player.y + PLAYER_H / 4);
  ctx.lineTo(player.x + PLAYER_W / 2, player.y + PLAYER_H / 2);
  ctx.closePath();
  ctx.fill();
}

function draw() {
  ctx.fillStyle = "#0d1230";
  ctx.fillRect(0, 0, W, H);

  ctx.fillStyle = "#ffd166";
  bullets.forEach((b) => {
    ctx.fillRect(b.x - b.w / 2, b.y - b.h / 2, b.w, b.h);
  });

  ctx.fillStyle = "#e94560";
  enemies.forEach((en) => {
    ctx.beginPath();
    ctx.moveTo(en.x, en.y - en.h / 2);
    ctx.lineTo(en.x - en.w / 2, en.y - en.h / 2);
    ctx.lineTo(en.x, en.y + en.h / 2);
    ctx.lineTo(en.x + en.w / 2, en.y - en.h / 2);
    ctx.closePath();
    ctx.fill();
  });

  drawPlayer();
}

function loop(time) {
  if (over) return;
  const dt = time - lastFrameTime;
  lastFrameTime = time;
  update(dt, time);
  draw();
  rafId = requestAnimationFrame(loop);
}

function startGame() {
  resetState();
  rafId = requestAnimationFrame((t) => {
    lastFrameTime = t;
    rafId = requestAnimationFrame(loop);
  });
}

board.addEventListener("pointerdown", onPointerDown);
board.addEventListener("pointermove", onPointerMove);
window.addEventListener("pointerup", onPointerUp);
restartBtn.addEventListener("click", startGame);

startGame();
