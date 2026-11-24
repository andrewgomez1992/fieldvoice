import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import chatRoutes from "./routes/chat.js";
import ttsRoutes from "./routes/tts.js";
import realtimeRoutes from "./routes/realtime.js";
import { errorHandler } from "./middleware/errorHandler.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.use("/api/chat", chatRoutes);
app.use("/api/tts", ttsRoutes);
app.use("/api/realtime-session", realtimeRoutes);
app.get("/api/health", (req, res) => res.send("OK"));

app.use(errorHandler);

export default app;
