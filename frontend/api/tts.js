/* eslint-disable no-undef */
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

  const params = {
    Text: text,
    OutputFormat: "mp3",
    VoiceId: process.env.TTS_VOICE || "Joanna",
    // "generative" is Polly's most human-sounding engine.
    Engine: process.env.TTS_ENGINE || "generative",
    SampleRate: "24000",
  };
  let AudioStream;
  try {
    ({ AudioStream } = await polly.synthesizeSpeech(params).promise());
  } catch (err) {
    if (params.Engine === "neural") throw err;
    ({ AudioStream } = await polly
      .synthesizeSpeech({ ...params, Engine: "neural" })
      .promise());
  }

  res.setHeader("Content-Type", "audio/mpeg");
  res.send(AudioStream);
}
