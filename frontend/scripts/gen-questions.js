import fs from "fs";
import path from "path";
import AWS from "aws-sdk";
import dotenv from "dotenv";

dotenv.config();

AWS.config.update({ region: process.env.AWS_REGION });
const polly = new AWS.Polly({ apiVersion: "2016-06-10" });

// Your eight static prompts
const qa = [
  "Who's filling out this report?",
  "What's the date?",
  "Location?",
  "What's the Area of Concern?",
  "And a description?",
  "What about the cause?",
  "Duration?",
  "What did the moisture meter read?",
];

async function gen() {
  const outDir = path.join("frontend", "public", "questions");
  fs.mkdirSync(outDir, { recursive: true });

  for (let i = 0; i < qa.length; i++) {
    const text = qa[i];
    console.log(`Generating question #${i}: "${text}"`);
    const { AudioStream } = await polly
      .synthesizeSpeech({
        Text: text,
        OutputFormat: "mp3",
        VoiceId: process.env.TTS_VOICE || "Joanna",
        Engine: "neural",
        SampleRate: "24000",
      })
      .promise();
    fs.writeFileSync(path.join(outDir, `${i}.mp3`), AudioStream);
  }
  console.log("All questions generated ✅");
}

gen().catch((err) => {
  console.error(err);
  process.exit(1);
});
