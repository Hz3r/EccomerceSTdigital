# ZERG Admin

Panel de administración y CRM de la tienda ZERG (Next.js 16).

## Levantar en local

1. Backend encendido en `http://localhost:3001` (ver `zerg-backend/README.md`).
2. Opcional, en `zerg-admin/.env.local`:
   ```
   NEXT_PUBLIC_API_URL=http://localhost:3001/api
   NEXT_PUBLIC_STORE_URL=http://localhost:3000
   ```
3. `pnpm install` y `pnpm dev` → `http://localhost:3002` (admin de prueba del seed: `admin@zerg.com` / `admin123`).

## Secciones del menú

| Grupo | Páginas |
|---|---|
| General | Dashboard: ingresos, órdenes, ticket promedio, gráficos de ventas por día, estado, categoría y más vendidos |
| Catálogo | Productos (con imagen y planes en el mismo editor), Categorías, Planes |
| Ventas y clientes | Órdenes (cambio de estado, detalle, WhatsApp), Clientes, Reseñas (aprobar / ocultar) |
| Contenido del sitio | Marca y header (logo, ícono, anuncio, menú), Portada (banner, destacado, tendencias, secciones), Contacto y pie |

El contenido del sitio se guarda en el backend (`GET/PUT /api/settings`) y la tienda lo lee al cargar.
Tema oscuro por defecto; el botón sol/luna lo cambia.
