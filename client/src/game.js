// Go Nuts Babe
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// Create Canvas
canvas.width = 640;
canvas.height = 640;
const gridSize = 16;
const cellSize = canvas.width / gridSize;

// Background Stars
const starCount = 100;
const stars = [];

// Game State
let safeCells = [];
let dangerousCells = [];
let player = { x: 7, y: 7 };
let gameOver = false;

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

// Start Game
function startGame() {
  createStars();
  drawStars();
  generateSafeCells();
}

document.getElementById("startButton").addEventListener("click", function () {
  const overlay = document.getElementById("overlay");

  if (overlay) {
    overlay.style.display = "none";
  }

  startGame();
});
