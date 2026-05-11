import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import "dotenv/config";
import "express-async-errors";
import http from "http";
import { Server } from "socket.io";

import mesasRouter from "./routes/mesas.js";
import productosRouter from "./routes/productos.js";
import ticketsRouter from "./routes/tickets.js";
import pagosRouter from "./routes/pagos.js";
import authRouter from "./routes/auth.js";
import usuariosRouter from "./routes/usuarios.js";
import categoriasRouter from "./routes/categorias.js";
import reportRouter from "./routes/report.js";
import cajaRouter from "./routes/caja.js";
import exportRouter from "./routes/export.js";
import estacionesRouter from "./routes/estaciones.js";
import cocinaRouter from "./routes/cocina.js";

import { authMiddleware } from "./lib/auth.js";
import { requireFeature } from "./lib/requireFeature.js";

import { rlAuth, rlAPI } from "./lib/rateLimit.js";
import { notFound, errorHandler } from "./lib/errors.js";

/* =========================================
   APP
========================================= */

const app = express();

/* =========================================
   SOCKET.IO
========================================= */

const server = http.createServer(app);

export const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

io.on("connection", (socket) => {
  console.log("Cliente conectado:", socket.id);

  socket.on("disconnect", () => {
    console.log("Cliente desconectado");
  });
});

/* =========================================
   CORS
========================================= */

const allowed = (process.env.CORS_ORIGINS || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin) {
        return cb(null, true);
      }

      if (!allowed.length || allowed.includes(origin)) {
        return cb(null, true);
      }

      return cb(new Error("CORS bloqueado: " + origin));
    },

    credentials: true,
  }),
);

/* =========================================
   MIDDLEWARES
========================================= */

app.use(helmet());

app.use(express.json());

app.use(morgan("dev"));

if (process.env.NODE_ENV === "production") {
  app.use(rlAPI);
}

app.use("/auth", rlAuth);

/* =========================================
   PUBLIC ROUTES
========================================= */

app.use("/auth", authRouter);

app.get("/health", (_, res) =>
  res.json({
    ok: true,
    ts: new Date().toISOString(),
  }),
);

/* =========================================
   PROTECTED ROUTES
========================================= */

app.use("/tickets", authMiddleware, ticketsRouter);

app.use("/pagos", authMiddleware, pagosRouter);

app.use("/usuarios", authMiddleware, usuariosRouter);

app.use("/mesas", authMiddleware, mesasRouter);

app.use("/productos", authMiddleware, productosRouter);

app.use("/categorias", authMiddleware, categoriasRouter);

app.use("/caja", authMiddleware, cajaRouter);

app.use("/export", authMiddleware, exportRouter);

app.use("/estaciones", authMiddleware, estacionesRouter);

/* =========================================
   FEATURE ROUTES
========================================= */

app.use("/cocina", authMiddleware, requireFeature("kitchen"), cocinaRouter);

app.use("/report", authMiddleware, requireFeature("dashboard"), reportRouter);

/* =========================================
   ERRORS
========================================= */

app.use(notFound);

app.use(errorHandler);

/* =========================================
   START
========================================= */

const port = Number(process.env.PORT || 8080);

server.listen(port, () => {
  console.log(`TPV API escuchando en http://localhost:${port}`);
});
