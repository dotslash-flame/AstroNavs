// Setting up the game canvas
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

canvas.width = 640;
canvas.height = 640;
const gridSize = 16;
const cellSize = canvas.width / gridSize;

//TODO: make these inputtable by command line
const game_room = "101"
const serverAddress = "192.168.0.175"
const serverPort = "5101"

// FIXME: these should be saved as a JSON file maybe
//        the game state json that keeps getting updated, or as a cookie
var isGameReady = false
var isGameOver = false


// Audio
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
button.addEventListener("click", () => {
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
});


try {
  bgMusic.play().catch(error => {
    console.log("Autoplay failed, music will play when unmuted:", error);
  })
} catch (error) {
  console.log("Couldn't play bgMusic", error);
}

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
  sendSafeCoordinatesToServer(safeCoords)
  isGameReady = false
  waitGameStart()
}

async function sendSafeCoordinatesToServer(safeCoords) {
  if (safeCoords.length == 0)
    return false
  uri = `http://${serverAddress}:${serverPort}/add_safe_coordinates/${game_room}`
  await fetch(uri, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/JSON'
    },
    body: JSON.stringify({
      safe_coordinates: safeCoords
    }),
    credentials: 'include'
  })
    .then(response => {
      if (response.ok) {
        return response.json()
      }
      else {
        console.error('Request failed with status:', response.status);
        throw new Error('Failed to connect to server');
      }
    })
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

// Random Sound for move
function playRandomMoveSound() {
  if (!mutedMusic) {
    const sound = moveSounds[Math.floor(Math.random() * moveSounds.length)];
    sound.play();
  }
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

// Game Loop
function gameLoop() {
  if (!gameOver) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawStars();
    // drawGrid();
    drawPlayer();
    drawTimer();
    requestAnimationFrame(gameLoop);
  }
}

// Start Game
function startGame() {
  createStars();
  generateSafeCells();
  gameLoop();

  const totalGameDuration = 300; // 5 mins
  const roundDurations = [60, 45, 45]; // First round: 60s, next two: 45s each
  const defaultRoundDuration = 30; // All remaining rounds: 30s each
  const timerElement = document.getElementById("timer");
  const overlay = document.getElementById("overlay"); // Round change

  let elapsedTime = 0;
  let currentRound = 0;
  let roundTimeLeft = roundDurations[currentRound] || defaultRoundDuration; // Initial round
  let gameOver = false;

  function showRoundOverlay(roundNumber) {
    if (overlay && !gameOver) {
      // Only show overlay if the game is not over
      overlay.style.display = "block";
      overlay.innerHTML = `<h1>Round ${roundNumber} Starting!</h1>`;
      setTimeout(() => {
        overlay.style.display = "none"; // Hide after 2sec
      }, 2000);
    }
  }

  function updateTimer() {
    if (gameOver) return; // Stop the timer if game is over

    if (timerElement) {
      timerElement.textContent = `Round ${currentRound + 1
        }, Time: ${roundTimeLeft}s`;
    }

    if (roundTimeLeft <= 0) {
      airStrike(); // Airstrike at the end of the round
      currentRound++;

      if (elapsedTime >= totalGameDuration) {
        endGame(false); // End the game if time runs out
        return;
      }

      const nextRoundDuration =
        roundDurations[currentRound] || defaultRoundDuration;

      if (elapsedTime + nextRoundDuration > totalGameDuration) {
        roundTimeLeft = totalGameDuration - elapsedTime; // Cap to remaining game time
      } else {
        roundTimeLeft = nextRoundDuration;
      }

      // Random SafeCells every round
      generateSafeCells();
      // Show overlay for new round only if the game is not over
      const playerPosition = `${player.x}-${player.y}`;
      if (safeCells.includes(playerPosition)) {
        showRoundOverlay(currentRound + 1);
      }
    }

    // Update time variables
    roundTimeLeft--;
    elapsedTime++;

    if (elapsedTime >= totalGameDuration) {
      endGame(true); // Player wins if they survive the total duration
    }
  }

  // Start the game timer
  showRoundOverlay(1); // Overlay for round 1
  const timerInterval = setInterval(updateTimer, 1000);
}

//  Fuck the game
function endGame(win) {
  if (gameOver) return; // Prevent running multiple times

  gameOver = true;
  bgMusic.pause(); // Stop background music
  bgMusic.currentTime = 0; // Reset the music
  const overlay = document.getElementById("overlay");

  if (overlay) {
    overlay.style.display = "flex"; // Show overlay
    overlay.innerHTML = win
      ? "<h1>You Survived! You Win!</h1>"
      : "<h1>Game Over! You Lost!</h1>";
    overlay.innerHTML +=
      '<button onclick="location.reload()">Restart Game</button>';
  }

  if (!win) {
    if (!mutedMusic) {
      airstrikeSound.play(); // Play airstrike sound if the player lost
    }
  }
}

// Very shitty design, ideally we don't let user click start game till it is ready
async function waitGameStart() {
  while (isGameReady === false) {
    await new Promise(resolve => setTimeout(resolve, 100)); // Poll every 100ms
  }
}

async function connectToServer() {
  uri = `http://${serverAddress}:${serverPort}/connect`
  await fetch(uri, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/JSON'
    },
    body: JSON.stringify({
      client: 'c',
      game_room: game_room
    }),
  })
    .then(response => {
      if (response.ok) {
        return response.json()
      }
      else {
        console.error('Request failed with status:', response.status);
        throw new Error('Failed to connect to server');
      }
    })
}

// io = require("socket.io")
// const socket = io.connect(`http://${serverAddress}:${serverPort}`)

// socket.on('all_clients_ready', (data, ackCallBack) => {
//   ackCallBack("Acknowledged")
//   isGameReady = true
// }
// )

// socket.on('game_start_c', (data, ackCallBack) => {
//   ackCallBack("Acknowledged")
//   isGameReady = true
// })

// document.getElementById("startButton").addEventListener("click", async function () {
//   const overlay = document.getElementById("overlay");

//   if (overlay) {
//     overlay.style.display = "none";
//   }

//   //TODO: Maybe add some loading thing between connect and wait game start
//   connectToServer()

//   await waitGameStart()

//   startGame();
// });

// Take Player Input
document.getElementById("coordinatesInput").addEventListener("keydown", (e) => {
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
});
