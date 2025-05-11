import { Router } from "express";
import ttsController from "./controllers/ttsController.js";

const router = Router();
router.post("/", ttsController);

export default function handler(req, res) {
  router(req, res);
}
