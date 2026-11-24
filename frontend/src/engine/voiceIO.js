import { playDynamic } from "../components/chat/tts/tts";
import { listenOnce, ListenTimeoutError } from "../components/chat/stt/stt";

export const SKIP = Symbol("skip");
export const BACK = Symbol("back");

export const YES =
  /\b(yes|yeah|yep|yup|correct|right|sure|affirmative|sounds good|looks good)\b/i;
export const NO =
  /\b(no|nope|nah|negative|done|that's it|that's all|nothing|all good|i'm good)\b/i;

// Voice commands only count when they're (almost) the whole phrase, so
// "skip the vanity, check the tub" is still treated as an answer.
const isCommand = (text, words) => {
  const t = text.toLowerCase().replace(/[^\w\s']/g, "").trim();
  return t.split(/\s+/).length <= 4 && words.test(t);
};
export const isSkip = (t) => isCommand(t, /\b(skip|next|pass|leave it blank|don't know|i don't know|not sure)\b/);
export const isBack = (t) => isCommand(t, /\b(go back|back up|previous|last question)\b/);
export const isRepeat = (t) => isCommand(t, /\b(repeat|say that again|what was that|come again|again)\b/);
export const isDone = (t) =>
  isCommand(t, /\b(i'm done|im done|i am done|that's it|thats it|finish|finished|wrap it up|wrap up|end report|all done)\b/);

export class WizardCancelled extends Error {
  constructor() {
    super("Report cancelled");
    this.name = "WizardCancelled";
  }
}

const MAX_TRIES = 3;

/**
 * Shared speak/listen helpers for both report modes.
 *
 * @param {{ signal?: AbortSignal, onStatus?: Function, onSay?: Function }} opts
 *   onStatus("speaking" | "listening" | "thinking" | "idle")
 *   onSay(text) - caption of what the app is saying, for noisy sites
 */
export function createVoice({ signal, onStatus = () => {}, onSay = () => {} } = {}) {
  const checkCancelled = () => {
    if (signal?.aborted) throw new WizardCancelled();
  };

  const say = async (text) => {
    checkCancelled();
    onSay(text);
    onStatus("speaking");
    await playDynamic(text);
    checkCancelled();
  };

  /**
   * Ask a question and wait for a spoken answer. Re-asks when nothing is
   * heard or the user says "repeat". Returns SKIP / BACK for those commands
   * (when allowed), or "" if still nothing after a few tries.
   */
  const ask = async (question, { timeout = 20000, commands = true } = {}) => {
    let prompt = question;
    for (let attempt = 1; attempt <= MAX_TRIES; ) {
      await say(prompt);
      onStatus("listening");
      let answer;
      try {
        answer = await listenOnce({ timeout });
      } catch (err) {
        checkCancelled();
        if (!(err instanceof ListenTimeoutError)) throw err;
        attempt++;
        prompt = `Sorry, I didn't catch that. ${question}`;
        continue;
      }
      checkCancelled();
      if (commands && isRepeat(answer)) {
        prompt = question;
        continue;
      }
      if (commands && isSkip(answer)) return SKIP;
      if (commands && isBack(answer)) return BACK;
      return answer;
    }
    await say("I'll leave that one blank for now.");
    return "";
  };

  const think = () => onStatus("thinking");
  const idle = () => onStatus("idle");

  return { say, ask, think, idle, checkCancelled };
}
