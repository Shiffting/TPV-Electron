# TPV Server

API REST para TPV (cafetería/bar).

## Requisitos
- Node.js LTS (20.x recomendado)
- MariaDB 10.6+ / 11.x

## Config
1. Crear `.env`:
DB_HOST=127.0.0.1
DB_PORT=3306
DB_NAME=tpv
DB_USER=root
DB_PASS=tu_password
PORT=8080
JWT_SECRET=cadena-aleatoria-larga
CORS_ORIGINS=http://localhost:3000

2. Instalar deps:
npm i

3. Crear BD y tablas (ver `/sql` o el script del proyecto).

4. Crear admin:
npm run seed:admin

## Ejecutar
npm run dev
Health: `GET /health`

## Auth
- `POST /auth/login` → { token }
- Usar `Authorization: Bearer <token>`

## Rutas Clave
- Mesas: `/mesas`
- Productos: `/productos`
- Tickets: `/tickets`
- Pagos: `/pagos`
- Report: `/report/kpis`, `/report/summary`, `/report/by-hour`, `/report/top-products`

## Producción/Servicio (Windows)
- Recom.: NSSM → Path: `node.exe`, Args: `.../src/app.js`, Startup dir: raíz proyecto.
- Logs en `C:\TPV\logs` (configurar en NSSM pestaña I/O).

## Seguridad
- Rate limit global + en `/auth`
- CORS whitelist configurable