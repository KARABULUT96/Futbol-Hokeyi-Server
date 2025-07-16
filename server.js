const socket = io("https://futbol-hokeyi-server.onrender.com");

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

let playerId = null;
let players = {};
let ball = { x: 400, y: 250 };

document.addEventListener("keydown", (e) => {
  if (playerId) {
    socket.emit("move", { playerId, key: e.key });
  }
});

socket.on("init", (data) => {
  playerId = data.playerId;
});

socket.on("state", (gameState) => {
  players = gameState.players;
  ball = gameState.ball;
  draw();
});

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Topu çiz
  ctx.beginPath();
  ctx.arc(ball.x, ball.y, 10, 0, Math.PI * 2);
  ctx.fillStyle = "black";
  ctx.fill();
  ctx.closePath();

  // Oyuncuları çiz
  for (const id in players) {
    const p = players[id];
    ctx.fillStyle = p.color || "blue";
    ctx.fillRect(p.x, p.y, 40, 40);
  }
}
