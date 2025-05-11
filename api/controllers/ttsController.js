import { ttsService } from "../services/ttsService.js";

export default async function ttsController(req, res, next) {
  try {
    const { text } = req.body;
    const audioBuffer = await ttsService(text);
    res.set({
      "Content-Type": "audio/mpeg",
      "Content-Length": audioBuffer.length,
    });
    res.send(audioBuffer);
  } catch (err) {
    next(err);
  }
}
