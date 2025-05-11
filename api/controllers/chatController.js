import { chatService } from "../services/chatService.js";

export default async function chatController(req, res, next) {
  try {
    const { history } = req.body;
    const reply = await chatService(history);
    res.json({ reply });
  } catch (err) {
    next(err);
  }
}
