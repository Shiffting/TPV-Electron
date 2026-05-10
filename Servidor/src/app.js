import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import 'dotenv/config';
import 'express-async-errors';

import mesas from './routes/mesas.js';
import productos from './routes/productos.js';
import tickets from './routes/tickets.js';
import pagos from './routes/pagos.js';
import auth from './routes/auth.js';
import usuarios from './routes/usuarios.js';
import categorias from './routes/categorias.js';
import { authMiddleware } from './lib/auth.js';
import report from './routes/report.js';
import { rlAuth, rlAPI } from './lib/rateLimit.js';
import { notFound, errorHandler } from './lib/errors.js';
import caja from './routes/caja.js';
import expcsv from './routes/export.js';

const app = express();

const allowed = (process.env.CORS_ORIGINS || '').split(',').map(s=>s.trim()).filter(Boolean);
app.use(cors({
  origin: (origin, cb) => {
    if (!origin) return cb(null, true);                // Postman / curl
    if (!allowed.length || allowed.includes(origin)) return cb(null, true);
    return cb(new Error('CORS bloqueado: ' + origin));
  },
  credentials: true
}));


app.use(helmet());
app.use(cors({ origin: true }));
app.use(express.json());
app.use(morgan('dev'));
//Rate limit
app.use(rlAPI);           // por defecto en toda la API
app.use('/auth', rlAuth); // más estricto solo en login

//proteger tickets y pagos
app.use('/tickets', authMiddleware, tickets);
app.use('/pagos',   authMiddleware, pagos);

app.use('/auth', auth);
app.use('/usuarios', usuarios);
app.get('/health', (_, res) => res.json({ ok: true, ts: new Date().toISOString() }));
app.use('/mesas', mesas);
app.use('/productos', productos);
app.use('/categorias', categorias);
app.use('/report', report);
app.use('/caja', caja);
app.use('/export', expcsv);

//Manejo errores al final de todo
app.use(notFound);
app.use(errorHandler);

const port = Number(process.env.PORT || 8080);
app.listen(port, () => console.log(`TPV API escuchando en http://localhost:${port}`));
