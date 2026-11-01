export function notFound(req, res) {
  res.status(404).json({ success: false, error: 'API route not found.' });
}

export function errorHandler(error, req, res, next) {
  if (res.headersSent) return next(error);
  if (error?.name === 'ValidationError' || error?.name === 'CastError') {
    return res.status(400).json({ success: false, error: 'Request data is invalid.' });
  }
  if (error?.code === 11000) {
    return res.status(409).json({ success: false, error: 'That record already exists.' });
  }
  const status = Number(error?.statusCode || error?.status || 500);
  if (status >= 500) process.stderr.write(`API error (${error?.name || 'Error'}${error?.code ? `, code ${String(error.code).slice(0, 40)}` : ''}).\n`);
  return res.status(status >= 400 && status < 500 ? status : 500).json({
    success: false,
    error: status < 500 ? (error.message || 'Request could not be completed.') : 'Something went wrong. Please try again.',
  });
}

export function httpError(statusCode, message) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}
