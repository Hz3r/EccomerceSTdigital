# ZERG Backend

API en Express 5 + Prisma 7 sobre **PostgreSQL**.

## Levantar en local (Windows + Laragon)

1. **Base de datos**: Prisma no levanta la base, solo se conecta a ella. En Laragon inicia **PostgreSQL**
   (Menú → PostgreSQL → Start). Si tu Laragon solo trae MySQL, agrega PostgreSQL desde
   Menú → Tools → Quick add, o instálalo aparte. Crea una base vacía llamada `zerg`.
2. **Variables de entorno**: copia `.env.example` como `.env` y pon tu contraseña de PostgreSQL en `DATABASE_URL`.
3. **Instalar y preparar la base**:
   ```bash
   pnpm install
   npx prisma generate
   npx prisma migrate deploy   # crea las tablas
   pnpm seed                   # catálogo de ejemplo (prisma/catalog.ts) y admin (admin@zerg.com / admin123)
   ```
4. **Iniciar la API**: `pnpm dev` → `http://localhost:3001` (debe mostrar `ZERG-BACKEND: ONLINE`).

`npx prisma studio` es solo un visor de la base de datos; no inicia la API ni la base.

## Frontend

En `zerg-frontend/.env.local`:

```
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

Luego `pnpm dev` en `zerg-frontend` (puerto 3000). Sin esa variable, la tienda usa datos de ejemplo.

## Rutas públicas de la tienda

- `GET /api/products`, `GET /api/products/:idOrSlug`
- `GET /api/categories`, `GET /api/categories/:id`
- `POST /api/orders` (compra como invitado; si hay sesión, la orden se asocia al usuario)
