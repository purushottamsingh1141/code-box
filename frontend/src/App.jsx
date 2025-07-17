import { useState, useEffect, useCallback } from "react";
import "./App.css";
import io from "socket.io-client";
import Editor from "@monaco-editor/react";
import myImage from "./image/code-box.png";

const socket = io("https://code-box-backend.onrender.com", {
  transports: ["websocket"],
});

const BACKEND_URL = "https://code-box-backend.onrender.com"; // Backend API URL

const App = () => {
  const [joined, setJoined] = useState(false);
  const [roomId, setRoomId] = useState("");
  const [userName, setUserName] = useState("");
  const [language, setLanguage] = useState("javascript");
  const [code, setCode] = useState("// start code here");
  const [copySuccess, setCopySuccess] = useState("");
  const [users, setUsers] = useState([]);
  const [typing, setTyping] = useState("");
  const [output, setOutput] = useState("");
  const [isCompiling, setIsCompiling] = useState(false);

  const joinRoom = useCallback(() => {
    if (roomId && userName) {
      socket.emit("join", { roomId, userName });
      setJoined(true);
    }
  }, [roomId, userName]);

  useEffect(() => {
    socket.on("userJoined", (users) => setUsers(users));
    socket.on("codeUpdate", (newCode) => setCode(newCode));
    socket.on("userTyping", (user) => {
      setTyping(`${user.slice(0, 8)}.... is Typing`);
      setTimeout(() => setTyping(""), 2000);
    });
    socket.on("languageUpdate", (newLanguage) => setLanguage(newLanguage));

    // ✅ Handle output received from other user
    socket.on("receiveOutput", (sharedOutput) => {
      setOutput(sharedOutput);
    });

    return () => {
      socket.off("userJoined");
      socket.off("codeUpdate");
      socket.off("userTyping");
      socket.off("languageUpdate");
      socket.off("receiveOutput"); // Clean listener
    };
  }, []);

  useEffect(() => {
    const handleBeforeUnload = () => {
      socket.emit("leaveRoom");
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, []);

  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.key === "Enter" && !joined && roomId && userName) {
        joinRoom();
      }
    };
    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [joined, roomId, userName, joinRoom]);

  const leaveRoom = () => {
    socket.emit("leaveRoom");
    setJoined(false);
    setRoomId("");
    setUserName("");
    setCode("// start code here");
    setLanguage("javascript");
    setOutput("");
  };

  const copyRoomId = () => {
    navigator.clipboard.writeText(roomId);
    setCopySuccess("Copied");
    setTimeout(() => setCopySuccess(""), 2000);
  };

  const handleCodeChange = (newCode) => {
    setCode(newCode);
    socket.emit("codeChange", { roomId, code: newCode });
    socket.emit("typing", { roomId, userName });
  };

  const handleLanguageChange = (e) => {
    const newLanguage = e.target.value;
    setLanguage(newLanguage);
    socket.emit("languageChange", { roomId, language: newLanguage });
  };

  // ✅ Modified to emit compileOutput to others
  const runCode = async () => {
    setIsCompiling(true);
    setOutput("Running...");
    try {
      const response = await fetch(`${BACKEND_URL}/compile`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, language }),
      });

      const result = await response.json();
      setOutput(result.output);

      // ✅ Broadcast result to others
      socket.emit("compileOutput", {
        roomId,
        output: result.output,
      });
    } catch (err) {
      setOutput("❌ Error compiling code.");
    } finally {
      setIsCompiling(false);
    }
  };

  if (!joined) {
    return (
      <div className="join-container">
        <div className="login-container">
          <div className="img-logo">
            <img src={myImage} alt="code-box-logo" />
            <div>
              <p className="logo-title">Codebox</p>
            </div>
          </div>
          <span className="logo-sub">realtime collaborative code editor</span>
          <h1 className="login-heading">Join Code Room</h1>

          <div className="input-wrapper">
            <span className="input-icon">🔑</span>
            <input
              type="text"
              placeholder="Room Id"
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
            />
          </div>

          <div className="input-wrapper">
            <span className="input-icon">👤</span>
            <input
              type="text"
              placeholder="Your Name"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
            />
          </div>

          <button onClick={joinRoom}>Join Room</button>
        </div>
      </div>
    );
  }

  return (
    <div className="editor-container">
      <div className="sidebar">
        <div className="room-info">
          <h2>Code Room: {roomId}</h2>
          <button onClick={copyRoomId} className="copy-button">
            Copy ID
          </button>
          {copySuccess && <span className="copy-success">{copySuccess}</span>}
        </div>
        <h3>User in Room:</h3>
        <ul>
          {users.map((user, index) => (
            <li key={index}>{user.slice(0, 8)}....</li>
          ))}
        </ul>

        <p className="typing-indicator">{typing}</p>

        <select
          className="language-selector"
          value={language}
          onChange={handleLanguageChange}
        >
          <option value="javascript">JavaScript</option>
          <option value="python">Python</option>
          <option value="java">Java</option>
          <option value="cpp">C++</option>
        </select>

        <button className="leave-btn" onClick={leaveRoom}>
          Leave Room
        </button>
      </div>

      <div className="editor-wrapper">
        <Editor
          height="70%"
          defaultLanguage={language}
          language={language}
          value={code}
          onChange={handleCodeChange}
          theme="hc-black"
          options={{
            minimap: { enabled: false },
            fontSize: 14,
          }}
        />

        <div className="compile-controls">
          <button onClick={runCode} className="run-button" disabled={isCompiling}>
            {isCompiling ? "Running..." : "Run Code"}
          </button>
          <pre className="output-box">{output}</pre>
        </div>
      </div>
    </div>
  );
};

export default App;
