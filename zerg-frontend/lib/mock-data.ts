import type { Category, Plan, Product, Review } from "@/types";

// Datos de ejemplo para el modo diseño: se usan cuando no hay backend configurado
// (ver USE_MOCKS en lib/api.ts).

const NOW = "2026-01-01T00:00:00.000Z";

function category(id: string, nombre: string, slug: string, descripcion: string): Category {
  return { id, nombre, slug, descripcion, isActive: true, creadoEn: NOW, actualizado: NOW };
}

export const mockCategories: Category[] = [
  category("cat-streaming", "Streaming", "streaming", "Películas, series y TV en vivo"),
  category("cat-musica", "Música", "musica", "Música y podcasts sin anuncios"),
  category("cat-ia", "Inteligencia Artificial", "ia", "Asistentes y herramientas de IA"),
  category("cat-diseno", "Diseño", "diseno", "Herramientas creativas y edición"),
  category("cat-productividad", "Productividad", "productividad", "Oficina, notas y almacenamiento"),
  category("cat-gaming", "Gaming", "gaming", "Suscripciones y tarjetas para gamers"),
  category("cat-seguridad", "VPN y Seguridad", "seguridad", "Navega seguro y sin límites"),
];

type PlanSeed = [duracion: string, precio: number, precioOriginal?: number];

function plans(productId: string, seeds: PlanSeed[]): Plan[] {
  return seeds.map(([duracion, precio, precioOriginal], i) => ({
    id: `${productId}-plan-${i + 1}`,
    nombre: duracion,
    slug: `${productId}-${duracion.toLowerCase().replace(/\s+/g, "-")}`,
    duracion,
    precio,
    precioOriginal,
    isActivo: true,
    productId,
    creadoEn: NOW,
    actualizado: NOW,
  }));
}

function product(
  slug: string,
  nombre: string,
  categoryId: string,
  descripcion: string,
  seeds: PlanSeed[]
): Product {
  const id = `prod-${slug}`;
  return {
    id,
    nombre,
    slug,
    descripcion,
    isActivo: true,
    categoryId,
    category: mockCategories.find((c) => c.id === categoryId),
    plans: plans(id, seeds),
    creadoEn: NOW,
    actualizado: NOW,
  };
}

export const mockProducts: Product[] = [
  product("netflix-premium", "Netflix Premium", "cat-streaming", "Perfil privado en calidad 4K Ultra HD con audio espacial. Disfruta series, películas y documentales en cualquier dispositivo.", [
    ["1 mes", 6.5, 8],
    ["3 meses", 18],
    ["6 meses", 34, 39],
  ]),
  product("disney-plus", "Disney+ Premium", "cat-streaming", "Disney, Pixar, Marvel, Star Wars y National Geographic en un solo lugar, con calidad 4K.", [
    ["1 mes", 4.5],
    ["3 meses", 12.5, 13.5],
  ]),
  product("max-hbo", "Max", "cat-streaming", "Series originales de HBO, películas de Warner Bros. y lo mejor de DC.", [
    ["1 mes", 4.9, 5.9],
    ["6 meses", 26],
  ]),
  product("prime-video", "Prime Video", "cat-streaming", "Películas, series Amazon Originals y deportes en vivo.", [
    ["1 mes", 3.9],
    ["12 meses", 39, 46.8],
  ]),
  product("crunchyroll", "Crunchyroll Mega Fan", "cat-streaming", "El catálogo de anime más grande del mundo, sin anuncios y con estrenos simultáneos.", [
    ["1 mes", 3.5],
    ["3 meses", 9.9],
  ]),
  product("spotify-premium", "Spotify Premium", "cat-musica", "Música sin anuncios, descargas offline y saltos ilimitados en tu propia cuenta.", [
    ["1 mes", 3.9, 4.9],
    ["3 meses", 10.9],
    ["12 meses", 39],
  ]),
  product("youtube-premium", "YouTube Premium", "cat-musica", "YouTube sin anuncios, reproducción en segundo plano y YouTube Music incluido.", [
    ["1 mes", 4.2],
    ["6 meses", 23, 25.2],
  ]),
  product("chatgpt-plus", "ChatGPT Plus", "cat-ia", "Acceso a los modelos más avanzados, generación de imágenes y respuestas más rápidas.", [
    ["1 mes", 14.9, 20],
  ]),
  product("gemini-advanced", "Gemini Advanced", "cat-ia", "Asistente de IA avanzado con 2 TB de almacenamiento incluido.", [
    ["1 mes", 12.9, 19.9],
    ["3 meses", 36],
  ]),
  product("canva-pro", "Canva Pro", "cat-diseno", "Plantillas premium, kit de marca, quitar fondos y millones de recursos.", [
    ["1 mes", 2.9],
    ["12 meses", 24.9, 34.8],
  ]),
  product("capcut-pro", "CapCut Pro", "cat-diseno", "Edición de video profesional con efectos, plantillas y exportación sin marca de agua.", [
    ["1 mes", 3.9],
    ["12 meses", 32],
  ]),
  product("microsoft-365", "Microsoft 365", "cat-productividad", "Word, Excel, PowerPoint y 1 TB en OneDrive para tu cuenta personal.", [
    ["12 meses", 19.9, 29.9],
  ]),
  product("duolingo-max", "Duolingo Super", "cat-productividad", "Aprende idiomas sin anuncios, con vidas ilimitadas y práctica personalizada.", [
    ["12 meses", 15.9],
  ]),
  product("game-pass", "Xbox Game Pass Ultimate", "cat-gaming", "Cientos de juegos en consola, PC y la nube, más EA Play incluido.", [
    ["1 mes", 9.9, 14.99],
    ["3 meses", 27.9],
  ]),
  product("playstation-plus", "PlayStation Plus Extra", "cat-gaming", "Catálogo de juegos de PS4 y PS5, multijugador en línea y descuentos exclusivos.", [
    ["1 mes", 9.5],
    ["12 meses", 89, 125],
  ]),
  product("nordvpn", "NordVPN", "cat-seguridad", "VPN rápida y segura para hasta 10 dispositivos, con bloqueo de anuncios y malware.", [
    ["1 mes", 3.9],
    ["12 meses", 29.9, 46.8],
  ]),
];

const reviewers = ["Carla M.", "Diego R.", "Lucía P.", "Andrés T.", "Valeria S."];
const comments = [
  "Me llegó el acceso en minutos, todo funcionando perfecto.",
  "Excelente atención por WhatsApp, resolvieron mi duda al instante.",
  "Buen precio y la cuenta funciona sin problemas desde hace meses.",
  "Muy recomendado, ya es mi segunda compra.",
];

export const mockReviews: Review[] = mockProducts.flatMap((p, i) =>
  [0, 1, 2].map((j) => ({
    id: `${p.id}-review-${j}`,
    puntuacion: (i + j) % 4 === 0 ? 4 : 5,
    comentario: comments[(i + j) % comments.length],
    isApproved: true,
    productId: p.id,
    userId: `user-${j}`,
    user: {
      id: `user-${j}`,
      nombre: reviewers[(i + j) % reviewers.length],
      email: "",
      rol: "CLIENTE" as const,
      isActive: true,
      creadoEn: NOW,
      actualizado: NOW,
    },
    creadoEn: NOW,
    actualizado: NOW,
  }))
);

for (const p of mockProducts) {
  p.reviews = mockReviews.filter((r) => r.productId === p.id);
}
