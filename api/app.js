import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { chatController } from "./controllers/chatController.js";
import { ttsController } from "./controllers/ttsController.js";
import { errorHandler } from "./middleware/errorHandler.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Directly mount:
app.post("/api/chat", chatController);
app.post("/api/tts", ttsController);
app.get("/api/health", (_req, res) => res.send("OK"));

// Central error handler
app.use(errorHandler);

export default app;
