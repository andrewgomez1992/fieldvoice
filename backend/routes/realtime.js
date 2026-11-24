import { Router } from "express";
import { createRealtimeSecret } from "../services/realtimeService.js";

export default new Router().post("/", async (req, res, next) => {
  try {
    res.json(await createRealtimeSecret());
  } catch (err) {
    next(err);
  }
});
