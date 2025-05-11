import { Router } from "express";
import chatController from "./controllers/chatController.js";

const router = Router();
router.post("/", chatController);

export default function handler(req, res) {
  // If you wanted a full Express app you could import app.js instead,
  // but a single-router function is leaner here:
  router(req, res);
}
