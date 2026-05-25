import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";

import "dotenv/config";
import "express-async-errors";

import http from "http";

import { Server } from "socket.io";

import authRouter from "./routes/auth.js";

import ticketsRouter from "./routes/tickets.js";
import productosRouter from "./routes/productos.js";
import categoriasRouter from "./routes/categorias.js";
import mesasRouter from "./routes/mesas.js";
import estacionesRouter from "./routes/estaciones.js";
import usuariosRouter from "./routes/usuarios.js";
import reportesRouter from "./routes/reportes.js";
import { authMiddleware } from "./lib/auth.js";
import empleadosRoutes from "./routes/empleados.js";


import {
  rlAuth,
  rlAPI,
} from "./lib/rateLimit.js";

/* =========================================
   APP
========================================= */

const app = express();

/* =========================================
   SERVER HTTP
========================================= */

const server =
  http.createServer(app);

/* =========================================
   SOCKET.IO
========================================= */

export const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

global.io = io;

io.on("connection", (socket) => {
  console.log(
    "Cliente conectado:",
    socket.id,
  );

  socket.on("disconnect", () => {
    console.log(
      "Cliente desconectado",
    );
  });
});

/* =========================================
   CORS
========================================= */

const allowed =
  (process.env.CORS_ORIGINS || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

app.use(
  cors({
    origin: (origin, cb) => {
      // Electron / apps locales
      if (!origin) {
        return cb(null, true);
      }

      if (
        !allowed.length ||
        allowed.includes(origin)
      ) {
        return cb(null, true);
      }

      return cb(
        new Error(
          "CORS bloqueado: " + origin,
        ),
      );
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

if (
  process.env.NODE_ENV ===
  "production"
) {
  app.use(rlAPI);
}

app.use("/auth", rlAuth);

/* =========================================
   HEALTHCHECK
========================================= */

app.get("/health", (_, res) => {
  res.json({
    ok: true,
    ts: new Date().toISOString(),
  });
});

/* =========================================
   RUTAS PÚBLICAS
========================================= */

app.use("/auth", authRouter);

/* =========================================
   RUTAS PROTEGIDAS
========================================= */

app.use(
  "/tickets",
  authMiddleware,
  ticketsRouter,
);

app.use(
  "/productos",
  authMiddleware,
  productosRouter,
);

app.use(
  "/categorias",
  authMiddleware,
  categoriasRouter,
);

app.use(
  "/mesas",
  authMiddleware,
  mesasRouter,
);

app.use(
  "/estaciones",
  authMiddleware,
  estacionesRouter,
);

app.use(
  "/usuarios",
  authMiddleware,
  usuariosRouter,
);

app.use(
  "/reportes",
  authMiddleware,
  reportesRouter,
);

app.use(
  "/empleados",
  empleadosRoutes,
);

/* =========================================
   ERROR GLOBAL
========================================= */

app.use((err, req, res, next) => {
  console.error("ERROR GLOBAL");

  console.error(err);

  res.status(500).json({
    error: err.message,
  });
});

/* =========================================
   START
========================================= */

const port = Number(
  process.env.PORT || 8080,
);

server.listen(port, () => {
  console.log(
    `TPV API escuchando en http://localhost:${port}`,
  );
});