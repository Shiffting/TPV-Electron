import rateLimit from 'express-rate-limit';

export const rlAuth = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 min
  max: 30,                  // máx. 30 intentos de login/10 min
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Demasiados intentos, espera un poco.' }
});

export const rlAPI = rateLimit({
  windowMs: 60 * 1000,  // 1 min
  max: 300,             // 300 req/min por IP
  standardHeaders: true,
  legacyHeaders: false
});
