/**
 * Send errors back as { error: { code, message } } with the upstream status,
 * so the app can show a clear message (e.g. "OpenAI is out of credits").
 */
// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  const status = Number(err.status || err.statusCode);
  const httpStatus = status >= 400 && status < 600 ? status : 500;
  const code = err.code || err.error?.code || err.type || "server_error";
  console.error(`[${httpStatus}] ${code}: ${err.message}`);
  res.status(httpStatus).json({ error: { code, message: err.message } });
}
