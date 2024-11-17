// Go Nuts Babe
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// Create Canvas
canvas.width = 640;
canvas.height = 640;
const gridSize = 16;
const cellSize = canvas.width / gridSize;

// Audio
const bgMusic = new Audio("bg.mp3");
const errorSound = new Audio("error.mp3");
const wrongMoveSound = new Audio("wrong-move.mp3");
const moveSounds = [new Audio("move.mp3"), new Audio("move-2.mp3")];
const airstrikeSound = new Audio("airstrike.mp3");
const airstrikeSoundNew = new Audio("airstrike-1.mp3");
bgMusic.loop = true;
bgMusic.volume = 0.2;

// Background Stars
const starCount = 100;
const stars = [];

// Game State
let safeCells = [];
let dangerousCells = [];
let player = { x: 7, y: 7 };
let gameOver = false;

// Timing
const gameDuration = 5 * 60; // 5 minutes
const moveDurations = [60, 45, 45, 30, 30, 30, 30, 30];
let currentMoveIndex = 0;
let currentMoveTime = moveDurations[currentMoveIndex];
let gameTimeRemaining = gameDuration;

// Timer Display
const timerDisplay = document.createElement("div");
timerDisplay.style.color = "white";
timerDisplay.style.fontSize = "20px";
timerDisplay.style.marginTop = "10px";
document.body.appendChild(timerDisplay);

// Create Stars
function createStars() {
  for (let i = 0; i < starCount; i++) {
    stars.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      radius: Math.random() * 2 + 1,
      brightness: Math.random(),
      speed: Math.random() * 0.03 + 0.01,
    });
  }
}

// Draw Stars
function drawStars() {
  ctx.fillStyle = "black";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  stars.forEach((star) => {
    star.brightness += star.speed;
    if (star.brightness > 1 || star.brightness < 0) {
      star.speed *= -1;
    }

    ctx.shadowBlur = 10;
    ctx.shadowColor = "white";
    ctx.fillStyle = `rgba(255, 255, 255, ${Math.abs(star.brightness)})`;
    ctx.beginPath();
    ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
    ctx.fill();
  });

  ctx.shadowBlur = 0;
  ctx.shadowColor = "transparent";
}

// Generate safe and dangerous cells
function generateSafeCells(num = 5) {
  safeCells = [];
  dangerousCells = [];

  while (safeCells.length < num) {
    const x = Math.floor(Math.random() * gridSize);
    const y = Math.floor(Math.random() * gridSize);
    const safeCell = `${x}-${y}`;
    if (!safeCells.includes(safeCell)) safeCells.push(safeCell);
  }

  for (let x = 0; x < gridSize; x++) {
    for (let y = 0; y < gridSize; y++) {
      const cellKey = `${x}-${y}`;
      if (!safeCells.includes(cellKey)) dangerousCells.push(cellKey);
    }
  }
}

// Display Timer
function drawTimer() {
  if (gameTimeRemaining > 0 && currentMoveTime > 0) {
    gameTimeRemaining -= 1 / 60;
    currentMoveTime -= 1 / 60;
  } else if (currentMoveIndex < moveDurations.length - 1) {
    currentMoveIndex++;
    currentMoveTime = moveDurations[currentMoveIndex];
  } else {
    console.log("game end");
  }

  const formatTime = (time) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
  };

  timerDisplay.textContent = `Game Time: ${formatTime(
    gameTimeRemaining
  )} | Move Time: ${formatTime(currentMoveTime)}`;
}

// Create Player
function drawPlayer() {
  const playerPosition = `${player.x}-${player.y}`;
  ctx.shadowBlur = safeCells.includes(playerPosition) ? 0 : 15;
  ctx.shadowColor = safeCells.includes(playerPosition) ? "transparent" : "red";

  ctx.fillStyle = "white";
  ctx.fillRect(player.x * cellSize, player.y * cellSize, cellSize, cellSize);

  ctx.shadowBlur = 0;
}

// Create Explosion
function showExplosion(x, y) {
  const centerX = x * cellSize + cellSize / 2;
  const centerY = y * cellSize + cellSize / 2;
  const maxRadius = cellSize * 3;
  const duration = 1000;
  const startTime = performance.now();

  function animateExplosion(currentTime) {
    const elapsed = currentTime - startTime;
    if (elapsed > duration) return;

    const progress = elapsed / duration;
    const radius = maxRadius * progress;
    const alpha = 1 - progress;

    // Explosion in surrounding cells
    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        // Avoid out-of-bounds)
        const neighborX = x + dx;
        const neighborY = y + dy;
        if (
          neighborX >= 0 &&
          neighborY >= 0 &&
          neighborX < gridSize &&
          neighborY < gridSize
        ) {
          const distance = Math.sqrt(dx * dx + dy * dy); // Distance from cell center
          if (distance <= progress) {
            // Impact Radius
            const offsetX = neighborX * cellSize + cellSize / 2;
            const offsetY = neighborY * cellSize + cellSize / 2;
            ctx.fillStyle = `rgba(255, 165, 0, ${alpha})`;
            ctx.beginPath();
            ctx.arc(offsetX, offsetY, radius, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }
    }

    // Continue
    requestAnimationFrame(animateExplosion);
  }

  requestAnimationFrame(animateExplosion);
}

// Start Game
function startGame() {
  createStars();
  drawStars();
  generateSafeCells();
  drawPlayer();
  drawTimer();
}

document.getElementById("startButton").addEventListener("click", function () {
  const overlay = document.getElementById("overlay");

  if (overlay) {
    overlay.style.display = "none";
  }

  startGame();
});

// Take Player Input
document.getElementById("coordinatesInput").addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    const [x, y] = e.target.value.split(",").map(Number);
    if (x >= 0 && x < gridSize && y >= 0 && y < gridSize) {
      player.x = x;
      player.y = y;
      const cellKey = `${x}-${y}`;
      e.target.value = "";
    } else {
      console.log("Invalid co-ordinates");
    }
  }
});
