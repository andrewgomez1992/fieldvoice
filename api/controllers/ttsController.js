import { ttsService } from "../services/ttsService.js";

export async function ttsController(req, res, next) {
  try {
    const { text } = req.body;
    const audio = await ttsService(text);
    res
      .set({
        "Content-Type": "audio/mpeg",
        "Content-Length": audio.length,
      })
      .send(audio);
  } catch (err) {
    next(err);
  }
}
