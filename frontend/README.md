# 🧠 Code-Box - Realtime Collaborative Code Editor

Code-Box is a full-stack real-time collaborative code editor where multiple users can join a room and write code together live. It supports syntax highlighting, language switching, typing indicators, and more.

![Code-Box Preview](./preview.png) <!-- (optional: add a preview image of your UI here) -->

---

## 🚀 Features

- ✅ Real-time code editing with Socket.IO
- ✅ Join or leave code rooms instantly
- ✅ Live typing indicator
- ✅ Select programming languages (JavaScript, Python, Java, C++)
- ✅ Copy Room ID to share with others
- ✅ Fully responsive frontend using React + Vite + Monaco Editor
- ✅ Backend powered by Express + Socket.IO

---

## 🛠 Tech Stack

**Frontend:**
- React
- Vite
- @monaco-editor/react
- Socket.IO Client

**Backend:**
- Node.js
- Express
- Socket.IO
- Deployed on Render (optional)

---

## 📦 Installation (Local Setup)

```bash
git clone https://github.com/purushottamsingh1141/code-box.git
cd code-box
npm install
npm run build        # builds frontend
npm run dev          # starts backend server on http://localhost:5000

