import express from "express";
import http from "http";
import { Server } from "socket.io";
import path from "path";

const app = express();

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

const rooms = new Map();

io.on("connection", (Socket) => {
  console.log("User Connected", Socket.id);

  let currentRoom = null;
  let currentUser = null;

  Socket.on("join", ({ roomId, userName }) => {
    if (currentRoom) {
      Socket.leave(currentRoom);
      rooms.get(currentRoom).delete(currentUser);
      io.to(currentRoom).emit(
        "userJoined",
        Array.from(roomId.get(currentRoom))
      );
    }

    currentRoom = roomId;
    currentUser = userName;

    Socket.join(roomId);

    if (!rooms.has(roomId)) {
      rooms.set(roomId, new Set());
    }

    rooms.get(roomId).add(userName);

    io.to(roomId).emit("userJoined", Array.from(rooms.get(currentRoom)));
  });

  Socket.on("codeChange", ({ roomId, code }) => {
    Socket.to(roomId).emit("codeUpdate", code);
  });

  Socket.on("leaveRoom", () => {
    if (currentRoom && currentUser) {
      rooms.get(currentRoom).delete(currentUser);
      io.to(currentRoom).emit("userJoined", Array.from(rooms.get(currentRoom)));

      Socket.leave(currentRoom);
      currentRoom = null;
      currentUser = null;
    }
  });

  Socket.on("typing", ({ roomId, userName }) => {
    Socket.to(roomId).emit("userTyping", userName);
  });

  Socket.on("languageChange", ({ roomId, language }) => {
    io.to(roomId).emit("languageUpdate", language);
  });

  Socket.on("disconnect", () => {
    if (currentRoom && currentUser) {
      rooms.get(currentRoom).delete(currentUser);
      io.to(currentRoom).emit("userJoined", Array.from(rooms.get(currentRoom)));
    }
    console.log("User Disconnected");
  });
});

const port = process.env.PORT || 5000;

const _dirname = path.resolve();
app.use(express.static(path.join(_dirname, "/frontend/dist")));

app.use((req, res) => {
  res.sendFile(path.join(_dirname, "frontend", "dist", "index.html"));
});

server.listen(port, () => {
  console.log("server is working on port 5000");
});
