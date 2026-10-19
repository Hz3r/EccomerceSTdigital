This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Modo diseño

Si no defines `NEXT_PUBLIC_API_URL` (o pones `NEXT_PUBLIC_USE_MOCKS=true`), la tienda usa los datos de ejemplo de `lib/mock-data.ts` para el catálogo y simula la creación de pedidos, así el frontend se puede diseñar sin el backend.

- Colores de marca ZERG: tokens `--brand*` en `app/globals.css` (utilidades `bg-brand`, `text-brand-strong`, `bg-brand-ink`, `bg-brand-yellow`, `bg-brand-gradient`, `bg-checker`).
- Logo e ícono: `public/zerg-logo.png` y `public/zerg-icon.png`.
- Opiniones de la portada: si el backend no devuelve reseñas aprobadas, se muestran las de ejemplo de `lib/mock-data.ts`. Antes de lanzar, define `NEXT_PUBLIC_SAMPLE_REVIEWS=false` para ocultarlas.
- Contenido editable: logo, header, portada y pie vienen de `GET /api/settings` (se editan en el admin, en "Contenido del sitio"). Sin backend se usan los valores de `lib/site-settings.ts`.
