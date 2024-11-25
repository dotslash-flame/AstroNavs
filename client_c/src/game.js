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
  console.log("Safe Coords:", safeCells);
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
    survived = false;
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
    currentMove++;
  }
}

// Networking
const server_ip = '172.16.148.79'
const server_port = 5000
const room_id = "101"

let survived = true;

const intervals = [10, 45, 45, 30, 30, 30, 30, 30]
let currentMove = 1;
let gameOver = false;

async function pollGameStart() {
  return new Promise((resolve) => {
    let interval = setInterval(async () => {
      var state = await getGameState()
      if (state["is_ready"]) {
        console.log("Game has started")
        clearInterval(interval)
        generateSafeCells()
        await sendSafeCoords()
        startRound(intervals[0])
        resolve()
      }
    }, 500)
  })
}

async function connect() {
  try {
    const response = await fetch(`http://${server_ip}:${server_port}/connect`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/JSON'
      },
      body: JSON.stringify({
        client: 'c',
        game_room: room_id,
      }),
      mode: "cors",
      credentials: "include"
    });
    await pollGameStart();
  } catch (error) {
    console.error("Connection error:", error);
  }
}

async function sendSafeCoords() {
  return new Promise(async resolve =>{
    try {
      const response = await fetch(`http://${server_ip}:${server_port}/add_safe_coordinates/${room_id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          'safe_coordinates': safeCells.map(pair => pair.split('-').map(Number)),
          'current_move': currentMove
        }),
        mode: 'cors',
        credentials : 'include'
      });
      resolve(response.json());
    } catch (error) {
      console.error("Error sending coordinates:", error);
    }
  })
}

async function getGameState() {
  try {
    const response = await fetch(`http://${server_ip}:${server_port}/get_game_state/${room_id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/JSON'
      },
      mode: "cors",
      credentials: "include"
    });
    return response.json();
  } catch (error) {
    console.error("Error getting game state:", error);
  }
}

async function informTimerEnded() {
  try {
    const response = await fetch(`http://${server_ip}:${server_port}/set_timer_over/${room_id}`, {
      method: 'GET',
      mode: "cors"
    });
    return response.json();
  } catch (error) {
    console.error("Error informing timer end:", error);
  }
}

async function pollNextRoundStart() {
  return new Promise((resolve, reject) => {
    let intervalState = setInterval(async () => {
      try {
        const response = await getGameState();
        if (response["game_over"]) {
          clearInterval(intervalState);
          gameOver = true;
          resolve(response);
        } else if (response["is_running"]) {
          clearInterval(intervalState);
          resolve(response);
        }
      } catch (error) {
        clearInterval(intervalState);
        reject(error);
      }
    }, 1000);
  });
}

async function startRound(duration) {
  // Start countdown
  let timeLeft = duration;
  const timerInterval = setInterval(async () => {
    timeLeft--;
    if (timeLeft <= 0) {
      clearInterval(timerInterval);
      await onRoundComplete();
    }
  }, 1000);
}

async function waitForTimerToEnd() {
  return new Promise(resolve =>  {
    let interval = setInterval(async () => {
      var state = await getGameState()
      if (!state["is_running"]) {
        clearInterval(interval)
        resolve()
      }
    }, 500)
  })
}

async function onRoundComplete() {
  
  await waitForTimerToEnd();

  // Trigger airstrike animation
  airStrike();
  

  updateGameState().catch(error => {
    console.error("Error updating game state:", error);
  });

  // Wait for airstrike animation and next round state
  const [response] = await Promise.all([
    pollNextRoundStart(),
    new Promise(resolve => setTimeout(resolve, 2000)) // Wait for airstrike animation
  ]);

  if (response["game_over"]) {
    endGame(response["is_won"]);
  } else if (response["is_running"]) {
    generateSafeCells();
    await sendSafeCoords();
    await startRound(intervals[currentMove]);
  }
}

function endGame(isWon) {
  gameOver = true;
  isGameOver = true;
  const overlay = document.createElement('div');
  overlay.style.position = 'fixed';
  overlay.style.top = '0';
  overlay.style.width = '100%';
  overlay.style.height = '100%';
  overlay.style.backgroundColor = 'rgba(0,0,0,0.8)';
  overlay.style.display = 'flex';
  overlay.style.justifyContent = 'center';
  overlay.style.alignItems = 'center';
  overlay.style.color = 'white';
  overlay.style.fontSize = '48px';
  overlay.innerHTML = isWon ? 'YOU WIN!' : 'GAME OVER';
  document.body.appendChild(overlay);
}

// Game Logic
var isGameOver = false;

async function updateGameState() {
  // const playerPosition = `${player.x}-${player.y}`;
  // const survived = safeCells.includes(playerPosition);
  return await fetch(`http://${server_ip}:${server_port}/update_game_state/${room_id}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      'survived': survived,
      'current_move': currentMove
    }),
    mode: 'cors'
  });
}

function timer(time) {
  document.getElementById("time").innerText = time;
  time--;
  if (time != -1) {
    setTimeout(() => { timer(time) }, 1000)
  }
}


// function gameLoop() {
//   if (!isGameOver) {
//     // Clear and redraw game state
//     ctx.clearRect(0, 0, canvas.width, canvas.height);
//     drawStars();
//     drawPlayer();

//     timer(intervals[currentMove] - 5);

//     // Update game state based on player position
//     updateGameState().catch(error => {
//       console.error("Error updating game state:", error);
//     });

//     // Continue game loop
//     requestAnimationFrame(gameLoop);
//   }
// // }

function startGame() {
  connect();

  // generateSafeCells();

  // sendSafeCoords();
  // gameLoop();
}


// game start UI interaction
document.getElementById("startButton").addEventListener("click",
  async () => {
    const overlay = document.getElementById("overlay");
    if (overlay) {
      overlay.style.display = "none";
    }
    createStars();
    drawStars();
    drawPlayer();

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