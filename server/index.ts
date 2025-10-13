import dotenv from "dotenv";
dotenv.config();

import express, { Request, Response } from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cookieParser from "cookie-parser";
import cors from "cors";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import cookie from "cookie";
import { fileURLToPath } from "url";
import path from "path";
import sequelize from "./libs/db.ts";
import User from "./models/User.ts";
import Message from "./models/Message.ts";
import Room from "./models/Room.ts";
import { isMessageInappropriate } from "./utils/aiFilter.ts";

// ----------------- Setup -----------------
const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: "http://localhost:5173", credentials: true },
});

app.use(cors({ origin: "http://localhost:5173", credentials: true }));
app.use(cookieParser());
app.use(express.json());

// ----------------- Static Frontend (Production) -----------------
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

if (process.env.NODE_ENV === "production") {
  const frontendPath = path.join(__dirname, "../client/dist");
  app.use(express.static(frontendPath));
  app.get("*", (req, res) => {
    res.sendFile(path.join(frontendPath, "index.html"));
  });
}

// ----------------- Database -----------------
await sequelize.authenticate();
console.log("✅ Database connected");
await sequelize.sync({ alter: true });

// ----------------- Types -----------------
interface AuthRequest extends Request {
  body: { username: string; password: string };
}

interface SendMessagePayload {
  content: string;
  senderId: number;
  senderUsername: string;
  room: string | number;
}

// ----------------- Middleware -----------------
export const authMiddleware = (req: Request, res: Response, next: Function) => {
  const token = req.cookies.jwt;
  if (!token) return res.status(401).json({ error: "Unauthorized" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!);
    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ error: "Invalid token" });
  }
};

// ----------------- Auth Routes -----------------
app.post("/api/register", async (req: AuthRequest, res: Response) => {
  const { username, password } = req.body;
  try {
    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({ username, password: hashed });
    res.json({ id: user.id, username: user.username });
  } catch (err) {
    res.status(400).json({ error: "User already exists" });
  }
});

app.post("/api/login", async (req: AuthRequest, res: Response) => {
  const { username, password } = req.body;
  const user = await User.findOne({ where: { username } });
  if (!user) return res.status(400).json({ error: "Invalid credentials" });

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) return res.status(400).json({ error: "Invalid credentials" });

  const token = jwt.sign(
    { id: user.id, username: user.username },
    process.env.JWT_SECRET!,
    { expiresIn: "1h" }
  );

  res.cookie("jwt", token, {
    httpOnly: true,
    secure: false,
    sameSite: "lax",
    maxAge: 2 * 60 * 60 * 1000,
  });

  res.json({ id: user.id, username: user.username });
});

app.post("/api/logout", (req, res) => {
  res.clearCookie("jwt", { httpOnly: true, sameSite: "lax" });
  res.json({ message: "Logged out" });
});

app.get("/api/check-auth", (req, res) => {
  const token = req.cookies.jwt;
  if (!token) return res.status(401).json({ authenticated: false });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!);
    res.json({ authenticated: true, user: decoded });
  } catch {
    res.status(401).json({ authenticated: false });
  }
});

// ----------------- Room Routes -----------------
app.get("/api/rooms", async (req, res) => {
  const rooms = await Room.findAll({ attributes: ["id", "roomname"] });
  res.json(rooms);
});

app.post("/api/rooms", authMiddleware, async (req: Request, res: Response) => {
  const { roomname } = req.body;
  try {
    const room = await Room.create({ roomname });
    res.json({ id: room.id, roomname: room.roomname });
  } catch {
    res.status(400).json({ error: "This room already exists" });
  }
});

// ----------------- Message Routes -----------------
app.get("/api/messages/:roomId", async (req: Request, res: Response) => {
  const roomId = Number(req.params.roomId);
  const msgs = await Message.findAll({
    where: { roomId },
    order: [["createdAt", "ASC"]],
  });
  const room = await Room.findByPk(roomId);
  res.json({ msgs, roomName: room ? room.roomname : null });
});

app.post("/api/messages", authMiddleware, async (req: Request, res: Response) => {
  const { content, senderId, senderUsername, roomId } = req.body;
  const inappropriate = await isMessageInappropriate(content);
  if (inappropriate) return res.status(400).json({ error: "Message rejected" });

  const message = await Message.create({ content, senderId, senderUsername, roomId });
  io.to(String(roomId)).emit("newMessage", message);
  res.json(message);
});

// ----------------- Socket.IO -----------------
io.use((socket, next) => {
  // Parse cookies from socket handshake headers
  const cookies = socket.handshake.headers.cookie;
  if (!cookies) return next(new Error("Unauthorized"));

  const parsed = cookie.parse(cookies);
  const token = parsed.jwt;
  if (!token) return next(new Error("Unauthorized"));

  try {
    const user = jwt.verify(token, process.env.JWT_SECRET!);
    socket.data.user = user; // store user info in socket
    next();
  } catch {
    next(new Error("Invalid token"));
  }
});

io.on("connection", (socket) => {
  console.log("✅ User connected:", socket.id);

  socket.on("joinRoom", (room: string | number) => {
    const roomId = Number(room);
    socket.join(String(roomId));
    console.log(`📥 User joined room ${roomId}`);
  });

  socket.on("leaveRoom", (room: string | number) => {
    socket.leave(String(room));
    console.log(`📤 User left room ${room}`);
  });

  socket.on("sendMessage", async (payload: SendMessagePayload) => {
    const { content, senderId, senderUsername, room } = payload;
    if (!content || !room) return;

    const roomId = Number(room);
    const message = await Message.create({ content, senderId, senderUsername, roomId });
    io.to(String(roomId)).emit("newMessage", message);
  });

  socket.on("disconnect", () => console.log("❌ User disconnected:", socket.id));
});

// ----------------- Start Server -----------------
const PORT = Number(process.env.PORT) || 5000;
httpServer.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
