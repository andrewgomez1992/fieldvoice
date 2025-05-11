import { Router } from "express";
import { chatController } from "../controllers/chatController.js";

export default new Router().post("/", chatController);
