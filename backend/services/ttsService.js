import AWS from "aws-sdk";
import dotenv from "dotenv";

dotenv.config();
AWS.config.update({ region: process.env.AWS_REGION });

// could probably omit apiVersion all together, has no effect on voice
const polly = new AWS.Polly({ apiVersion: "2016-06-10" });

export async function ttsService(text) {
  if (!text) throw new Error("No text provided for TTS");
  const params = {
    Text: text,
    OutputFormat: "mp3",
    VoiceId: process.env.TTS_VOICE || "Joanna",
    Engine: "neural",
    SampleRate: "24000",
  };
  const { AudioStream } = await polly.synthesizeSpeech(params).promise();
  return AudioStream;
}
