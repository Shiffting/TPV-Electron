export class HttpError extends Error {
  constructor(status = 500, message = 'Internal error', details = null) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

export const notFound = (req, res, next) => {
  next(new HttpError(404, `No encontrado: ${req.method} ${req.originalUrl}`));
};

export const errorHandler = (err, req, res, _next) => {
  const status = err.status || 500;
  const payload = {
    error: err.message || 'Internal error',
  };
  if (err.details) payload.details = err.details;
  // log mínimo
  if (status >= 500) {
    console.error('ERR', {
      url: req.originalUrl,
      method: req.method,
      msg: err.message,
      stack: err.stack?.split('\n').slice(0,3).join(' | ')
    });
  }
  res.status(status).json(payload);
};

// helper para rutas async (evita try/catch repetido)
export const asyncHandler = fn => (req,res,next) => Promise.resolve(fn(req,res,next)).catch(next);
