export function notFoundHandler(req, res) {
  res.status(404).json({ success: false, message: `Route not found: ${req.method} ${req.originalUrl}` });
}

export function errorHandler(error, req, res, next) {
  console.error(error);
  const status = error.statusCode || (error.code === 11000 ? 409 : 500);
  res.status(status).json({
    success: false,
    message: error.code === 11000 ? 'An account with this email already exists' : status === 500 ? 'Internal server error' : error.message,
    ...(error.details ? { details: error.details } : {}),
  });
}
