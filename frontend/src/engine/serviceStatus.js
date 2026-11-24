/**
 * Turns API failures into plain-English messages and broadcasts them, so
 * the app never fails silently (e.g. "OpenAI is out of credits").
 */

const listeners = new Set();

export function onServiceError(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

/** Pull { status, code, message } out of axios / fetch / plain errors. */
export function describeError(err) {
  const body = err?.response?.data?.error ?? err?.data?.error ?? err?.error;
  const status = err?.response?.status ?? err?.status;
  const code = (typeof body === "object" ? body?.code || body?.type : null) || err?.code;
  const message =
    (typeof body === "object" ? body?.message : body) || err?.message || String(err);
  return { status, code, message };
}

export function friendlyError(err) {
  const { status, code, message } = describeError(err);
  const text = `${code || ""} ${message || ""}`.toLowerCase();

  if (/insufficient_quota|credit_balance|no credits|billing/.test(text)) {
    return "Your OpenAI account is out of credits. Add credits at platform.openai.com → Settings → Billing, then try again.";
  }
  if (/missing_api_key|openai_api_key is not set/.test(text)) {
    return "The server has no OpenAI API key. Add OPENAI_API_KEY to backend/.env and restart the backend.";
  }
  if (/invalid_api_key|incorrect api key/.test(text) || status === 401) {
    return "The OpenAI API key isn't valid. Create a new key at platform.openai.com → API keys and put it in backend/.env.";
  }
  if (/model_not_found|does not have access to model/.test(text)) {
    return `Your OpenAI account can't use this model yet (${message}).`;
  }
  if (/rate_limit/.test(text) || status === 429) {
    return "OpenAI is getting too many requests. Wait a few seconds and try again.";
  }
  if (/permission|notallowederror|not-allowed/.test(text)) {
    return "Microphone access is blocked. Allow the microphone for this site in your browser settings.";
  }
  if (/network error|failed to fetch|econnrefused|load failed/.test(text) || (err?.request && !err?.response)) {
    return "Can't reach the FieldVoice server. Make sure the backend is running (npm start in the backend folder).";
  }
  return message || "Something went wrong.";
}

/** Report an error to any listening banner; returns the friendly text. */
export function reportServiceError(err) {
  const msg = friendlyError(err);
  listeners.forEach((fn) => fn(msg));
  return msg;
}
