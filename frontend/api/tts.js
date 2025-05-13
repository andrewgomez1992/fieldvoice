import microCors from "micro-cors";
import AWS from "aws-sdk";

const cors = microCors();

AWS.config.update({ region: process.env.AWS_REGION });
const polly = new AWS.Polly({ apiVersion: "2016-06-10" });

export default async function handler(req, res) {
  await cors(req, res);

  if (req.method !== "POST") {
    return res.status(405).end();
  }
  const { text } = req.body;
  if (!text) {
    return res.status(400).json({ error: "text is required" });
  }

  const { AudioStream } = await polly
    .synthesizeSpeech({
      Text: text,
      OutputFormat: "mp3",
      VoiceId: process.env.TTS_VOICE || "Joanna",
      Engine: "neural",
      SampleRate: "24000",
    })
    .promise();

  res.setHeader("Content-Type", "audio/mpeg");
  res.send(AudioStream);
}
