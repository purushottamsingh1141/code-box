// 📁 server/index.js
import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import axios from "axios";
import dotenv from "dotenv";
dotenv.config();

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 5000;

app.use(express.json());

app.use(
  cors({
    origin: ["http://localhost:5173"],
    methods: ["GET", "POST"],
  })
);

//  Health Check
app.get("/", (req, res) => {
  res.send("CodeBox backend is running 🎉");
});

//  Language to Judge0 Language ID Map
const langMap = {
  cpp: 54,
  python: 71,
  javascript: 63,
  java: 62,
  c: 50,
  typescript: 74,
};

//  Compile Code via Judge0
app.post("/compile", async (req, res) => {
  const { code, language } = req.body;

  try {
    const response = await axios.post(
      "https://judge0-ce.p.rapidapi.com/submissions?base64_encoded=false&wait=true",
      {
        source_code: code,
        language_id: langMap[language.toLowerCase()],
      },
      {
        headers: {
          "Content-Type": "application/json",
          "X-RapidAPI-Key":
            "cb33d3105dmshceb7ac904975203p12c386jsn898b35c2630b",
          "X-RapidAPI-Host": "judge0-ce.p.rapidapi.com",
        },
      }
    );

    res.json({
      output: response.data.stdout || response.data.stderr || "No output.",
    });
  } catch (error) {
    console.error("❌ Compilation Error:", error?.response?.data || error);
    res.status(500).json({ error: "Compilation failed." });
  }
});

//  Socket.IO Setup
const io = new Server(server, {
  cors: {
    origin: "https://code-9cwemfoyu-purushottam-singhs-projects.vercel.app",
    methods: ["GET", "POST"],
  },
});

const rooms = new Map();

io.on("connection", (socket) => {
  console.log(" User Connected:", socket.id);

  let currentRoom = null;
  let currentUser = null;

  socket.on("join", ({ roomId, userName }) => {
    if (currentRoom) {
      socket.leave(currentRoom);
      rooms.get(currentRoom)?.delete(currentUser);
      io.to(currentRoom).emit(
        "userJoined",
        Array.from(rooms.get(currentRoom) || [])
      );
    }

    currentRoom = roomId;
    currentUser = userName;

    socket.join(roomId);

    if (!rooms.has(roomId)) {
      rooms.set(roomId, new Set());
    }

    rooms.get(roomId).add(userName);
    io.to(roomId).emit("userJoined", Array.from(rooms.get(roomId)));
  });

  socket.on("codeChange", ({ roomId, code }) => {
    io.to(roomId).emit("codeUpdate", code);
  });

  socket.on("typing", ({ roomId, userName }) => {
    socket.to(roomId).emit("userTyping", userName);
  });

  socket.on("languageChange", ({ roomId, language }) => {
    io.to(roomId).emit("languageUpdate", language);
  });

  socket.on("shareOutput", ({ roomId, output }) => {
    io.to(roomId).emit("receiveOutput", output);
  });

  socket.on("leaveRoom", () => {
    if (currentRoom && currentUser) {
      rooms.get(currentRoom)?.delete(currentUser);
      io.to(currentRoom).emit(
        "userJoined",
        Array.from(rooms.get(currentRoom) || [])
      );
      socket.leave(currentRoom);
      currentRoom = null;
      currentUser = null;
    }
  });

  socket.on("disconnect", () => {
    if (currentRoom && currentUser) {
      rooms.get(currentRoom)?.delete(currentUser);
      io.to(currentRoom).emit(
        "userJoined",
        Array.from(rooms.get(currentRoom) || [])
      );
    }
    console.log("❌ User Disconnected:", socket.id);
  });
});

//  Start Server
server.listen(PORT, () => {
  console.log(`🚀 CodeBox backend running on port ${PORT}`);
});
