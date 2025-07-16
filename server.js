const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" }
});

const PORT = process.env.PORT || 3000;

// Oyun durumu
let players = {};
let ball = {
  x: 400,
  y: 200,
  vx: 5,
  vy: 3
};

const canvasWidth = 800;
const canvasHeight = 400;

function resetBall() {
  ball.x = canvasWidth / 2;
  ball.y = canvasHeight / 2;
  ball.vx = 5 * (Math.random() > 0.5 ? 1 : -1);
  ball.vy = 3 * (Math.random() > 0.5 ? 1 : -1);
}

// Oyuncu başlangıç pozisyonları
function createPlayer(id) {
  let x = Object.keys(players).length === 0 ? 50 : canvasWidth - 50;
  let y = canvasHeight / 2;
  return { x, y, speed: 7, id };
}

io.on("connection", (socket) => {
  console.log("Yeni oyuncu bağlandı:", socket.id);
  if (Object.keys(players).length >= 2) {
    socket.emit("full", "Oyun dolu!");
    socket.disconnect();
    return;
  }

  players[socket.id] = createPlayer(socket.id);
  socket.emit("init", { id: socket.id });
  
  // Oyuncu hareket komutlarını al
  socket.on("move", (keys) => {
    const player = players[socket.id];
    if (!player) return;
    if (keys.up && player.y > 40) player.y -= player.speed;
    if (keys.down && player.y < canvasHeight - 40) player.y += player.speed;
  });

  socket.on("disconnect", () => {
    console.log("Oyuncu ayrıldı:", socket.id);
    delete players[socket.id];
  });
});

// Top hareketi ve çarpışma kontrolü
function updateBall() {
  ball.x += ball.vx;
  ball.y += ball.vy;

  // Yukarı ve aşağı duvara çarpma
  if (ball.y < 10 || ball.y > canvasHeight - 10) {
    ball.vy = -ball.vy;
  }

  // Sol oyuncu paddle kontrolü
  const leftPlayer = Object.values(players)[0];
  if (leftPlayer && ball.x < leftPlayer.x + 10 && ball.x > leftPlayer.x) {
    if (ball.y > leftPlayer.y - 40 && ball.y < leftPlayer.y + 40) {
      ball.vx = -ball.vx;
    }
  }

  // Sağ oyuncu paddle kontrolü
  const rightPlayer = Object.values(players)[1];
  if (rightPlayer && ball.x > rightPlayer.x - 10 && ball.x < rightPlayer.x) {
    if (ball.y > rightPlayer.y - 40 && ball.y < rightPlayer.y + 40) {
      ball.vx = -ball.vx;
    }
  }

  // Top sağdan veya soldan çıkarsa resetle
  if (ball.x < 0 || ball.x > canvasWidth) {
    resetBall();
  }
}

// Oyun durumunu sürekli gönder
setInterval(() => {
  updateBall();
  io.emit("state", { players, ball });
}, 1000 / 60);

server.listen(PORT, () => {
  console.log(`Server ${PORT} portunda çalışıyor`);
});