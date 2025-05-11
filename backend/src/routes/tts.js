import { Router } from "express";
import { ttsController } from "../controllers/ttsController.js";

export default new Router().post("/", ttsController);
