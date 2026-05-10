import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import "dotenv/config";
import "express-async-errors";
import http from "http";
import { Server } from "socket.io";

import mesas from "./routes/mesas.js";
import productos from "./routes/productos.js";
import tickets from "./routes/tickets.js";
import pagos from "./routes/pagos.js";
import auth from "./routes/auth.js";
import usuarios from "./routes/usuarios.js";
import categorias from "./routes/categorias.js";
import { authMiddleware } from "./lib/auth.js";
import report from "./routes/report.js";
import { rlAuth, rlAPI } from "./lib/rateLimit.js";
import { notFound, errorHandler } from "./lib/errors.js";
import caja from "./routes/caja.js";
import expcsv from "./routes/export.js";
import estacionesRouter from "./routes/estaciones.js";
import cocinaRouter from "./routes/cocina.js";

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
      if (!origin) return cb(null, true);

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
   ROUTES
========================================= */

app.use("/tickets", authMiddleware, tickets);

app.use("/pagos", authMiddleware, pagos);

app.use("/auth", auth);

app.use("/usuarios", usuarios);

app.use("/mesas", mesas);

app.use("/productos", productos);

app.use("/categorias", categorias);

app.use("/report", report);

app.use("/caja", caja);

app.use("/export", expcsv);

app.use("/estaciones", estacionesRouter);

app.use("/cocina", cocinaRouter);

app.get("/health", (_, res) =>
  res.json({
    ok: true,
    ts: new Date().toISOString(),
  }),
);

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
