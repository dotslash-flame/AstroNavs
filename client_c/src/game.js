// Setting up the game canvas
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

canvas.width = 680;
canvas.height = 680;
const gridSize = 17;
const cellSize = canvas.width / gridSize;

// Background Stars
const starCount = 100;
const stars = [];

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

// Generate random safe co-ords
let safeCells = [];
let dangerousCells = [];

function generateSafeCells(num = 5) {
  safeCells = [];
  dangerousCells = [];
  safeCoords = [];

  while (safeCells.length < num) {
    const x = Math.floor(Math.random() * gridSize);
    const y = Math.floor(Math.random() * gridSize);
    const safeCell = `${x}-${y}`;
    if (!safeCells.includes(safeCell)) safeCells.push(safeCell);

    if (!safeCoords.includes((x, y))) safeCoords.push((x, y))
  }

  for (let x = 0; x < gridSize; x++) {
    for (let y = 0; y < gridSize; y++) {
      const cellKey = `${x}-${y}`;
      if (!safeCells.includes(cellKey)) dangerousCells.push(cellKey);
    }
  }
}

// Player Rendering
let player = { x: 8, y: 8 };

// Create Player
function drawPlayer() {
  const playerPosition = `${player.x}-${player.y}`;
  ctx.shadowBlur = safeCells.includes(playerPosition) ? 0 : 15;
  ctx.shadowColor = safeCells.includes(playerPosition) ? "transparent" : "red";

  ctx.fillStyle = "white";
  ctx.fillRect(player.x * cellSize, player.y * cellSize, cellSize, cellSize);

  ctx.shadowBlur = 0;
}

// AUDIO
const bgMusic = new Audio("./public/assets/audio/bg.mp3");
const errorSound = new Audio("./public/assets/audio/error.mp3");
const wrongMoveSound = new Audio("./public/assets/audio/wrong-move.mp3");
const moveSounds = [
  new Audio("./public/assets/audio/move.mp3"),
  new Audio("./public/assets/audio/move-2.mp3"),
];
const airstrikeSound = new Audio("./public/assets/audio/airstrike.mp3");
const airstrikeSoundNew = new Audio(
  "./public/assets/audio/airstrike-1.mp3"
);

mutedMusic = true;

bgMusic.loop = true;
bgMusic.volume = 0.2;
bgMusic.muted = true;

const button = document.getElementById("musicToggleBtn")
button.addEventListener("click",
  () => {
    if (mutedMusic) {
      mutedMusic = false;

      bgMusic.muted = false;
      button.innerHTML = "🎵 Music: On";

      // Try to play bg music if not already playing
      if (bgMusic.paused) {
        bgMusic.play().catch(error => {
          console.log("Error playing background music:", error);
        });
      }
    } else {
      mutedMusic = true;

      bgMusic.muted = true;
      button.innerHTML = "🎵 Music: Off";
    }
  }
);

// Random Sound for move
function playRandomMoveSound() {
  if (!mutedMusic) {
    const sound = moveSounds[Math.floor(Math.random() * moveSounds.length)];
    sound.play();
  }
}

// FX
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
        // Avoid out-of-bounds
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

// Airstrike
function airStrike() {
  if (gameOver) return;

  console.log("Airstrike Triggered!!");

  // Check if the player is in a dangerous cell
  const playerPosition = `${player.x}-${player.y}`;
  if (dangerousCells.includes(playerPosition)) {
    showExplosion(player.x, player.y);
    if (!mutedMusic) {
      airstrikeSound.play();
    }
    endGame(false);
  } else {
    if (!mutedMusic) {
      airstrikeSoundNew.play();
    }
    const numExplosions = 10;
    const explosionCoords = dangerousCells
      .sort(() => 0.5 - Math.random())
      .slice(0, numExplosions);

    //   Random Explosion
    explosionCoords.forEach((coord) => {
      const [x, y] = coord.split("-").map(Number);
      showExplosion(x, y);
    });
  }
}

// Networking
// Link for connecting to the game
const server_ip = '172.16.148.79'
const server_port = 5000
const room_id = 101

const intervals = [5, 45, 45, 30, 30, 30, 30, 30]

async function pollGameStart() {
  let interval = setInterval(async () => {
    var state = await getGameState()
    if (state["is_running"]) {
      console.log("Game has started")
      clearInterval(interval)
      timer(intervals[0])
    }
  }, 500
  )
}

async function connect() {
  response = await fetch(`http://${server_ip}:${server_port}/connect`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/JSON'
    },
    body: JSON.stringify({
      client: 'c', // client
      game_room: room_id, // game room, change from hard coded to command line,
    }),
    mode: "cors"
  }).then(() => pollGameStart())
}

async function sendSafeCoords() {
  response = await fetch(`http://${server_ip}:${server_port}/add_safe_coordinates/${room_id}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      'safe_coordinates': safeCells.map(pair => pair.split('-').map(Number)),
      'current_move': 1   // TODO: keep a move counter that this will use
    }),
    mode: 'cors'
  })
  return response.json()
}


// Game Logic
var isGameOver = false

function gameLoop() {
  if (!isGameOver) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawStars();
    drawPlayer();
    requestAnimationFrame(gameLoop);

    // TODO: add networking
  }
}

function startGame() {
  connect();
  createStars();

  generateSafeCells();

  sendSafeCoords();
  gameLoop();
}


// game start UI interaction
document.getElementById("startButton").addEventListener("click",
  async () => {
    const overlay = document.getElementById("overlay");
    if (overlay) {
      overlay.style.display = "none";
    }
    startGame();
  }
);

document.getElementById("coordinatesInput").addEventListener("keydown",
  (e) => {
    if (e.key === "Enter") {
      const [x, y] = e.target.value.split(",").map(Number);
      if (x >= 0 && x < gridSize && y >= 0 && y < gridSize) {
        player.x = x;
        player.y = y;
        const cellKey = `${x}-${y}`;

        if (!mutedMusic) {
          if (dangerousCells.includes(cellKey)) {
            wrongMoveSound.play();
          } else {
            playRandomMoveSound();
          }
        }

        e.target.value = "";
      } else {

        if (!mutedMusic) {
          errorSound.play();
        }

      }
    }
  }
);