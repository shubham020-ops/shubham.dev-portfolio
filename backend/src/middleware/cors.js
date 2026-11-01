import cors from 'cors';

/** Credentialed CORS with exact origins only; never reflects an unapproved origin. */
export function createCorsMiddleware(frontendOrigins) {
  const allowlistedCors = cors({
    origin(origin, callback) {
      if (!origin || frontendOrigins.includes(origin)) return callback(null, true);
      const error = new Error('Origin is not allowed by CORS.');
      error.statusCode = 403;
      return callback(error);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token', 'X-Confirm-Delete'],
    exposedHeaders: ['X-Next-Cursor'],
  });

  return (req, res, next) => {
    const requestOrigin = `${req.protocol}://${req.get('host')}`;
    if (req.get('origin') === requestOrigin) return next();
    return allowlistedCors(req, res, next);
  };
}
