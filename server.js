// server.js

const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*", // Gerekirse sadece Netlify adresini yazarsın
    methods: ["GET", "POST"],
  },
});

let players = {};
let ball = { x: 300, y: 200, vx: 0, vy: 0 };

io.on("connection", (socket) => {
  console.log("Bir oyuncu bağlandı:", socket.id);

  // Yeni oyuncu bilgisi ekle
  players[socket.id] = {
    x: 100 + Math.random() * 400,
    y: 100 + Math.random() * 200,
  };

  // Yeni bağlanan oyuncuya mevcut oyuncuları ve topu gönder
  socket.emit("currentState", {
    players,
    ball,
  });

  // Diğer oyunculara yeni oyuncuyu bildir
  socket.broadcast.emit("newPlayer", {
    id: socket.id,
    x: players[socket.id].x,
    y: players[socket.id].y,
  });

  // Oyuncu hareket ettiğinde
  socket.on("move", (data) => {
    if (players[socket.id]) {
      players[socket.id].x = data.x;
      players[socket.id].y = data.y;
      socket.broadcast.emit("playerMoved", {
        id: socket.id,
        x: data.x,
        y: data.y,
      });
    }
  });

  // Topun hareketi (sadece 1 oyuncu gönderecek bu bilgiyi)
  socket.on("ballUpdate", (data) => {
    ball = data;
    socket.broadcast.emit("ballUpdate", ball);
  });

  // Oyuncu bağlantısı kesildiğinde
  socket.on("disconnect", () => {
    console.log("Oyuncu ayrıldı:", socket.id);
    delete players[socket.id];
    socket.broadcast.emit("playerDisconnected", socket.id);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Sunucu ${PORT} portunda çalışıyor`);
});
