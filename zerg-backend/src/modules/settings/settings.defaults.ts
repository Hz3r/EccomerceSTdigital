// Contenido por defecto de la tienda. Lo que se guarda desde el panel admin
// se combina con estos valores, así una clave nueva nunca deja la tienda vacía.
// Mantener sincronizado con zerg-frontend/lib/site-settings.ts.

// Marca que llevan las listas de objetos: guarda la forma de cada elemento para validarlos.
export const LIST_ITEM = Symbol("listItem");

/** Lista cuyos elementos tienen la forma de `item` (ej. enlaces del menú, plataformas con logo). */
export function listOf<T>(item: T, items: T[] = []): T[] {
  return Object.defineProperty([...items], LIST_ITEM, { value: item, enumerable: false });
}

// Enlace dentro de un menú desplegable. La imagen es opcional (ej. logo de la tarjeta de regalo).
const enlaceMenu = { etiqueta: "", url: "", imagenUrl: "" };
// Columna de un menú desplegable: un título y sus enlaces.
const grupoMenu = { titulo: "", enlaces: listOf(enlaceMenu) };
// Elemento de la barra de categorías. Con `categoria` enlaza a esa categoría; si no, a `url`.
// Con `desplegable` muestra sus grupos en un panel (escritorio) o acordeón (móvil).
const itemMenu = { etiqueta: "", categoria: "", url: "", desplegable: false, grupos: listOf(grupoMenu) };
const categoriaMenu = (categoria: string) => ({ ...itemMenu, categoria, grupos: [] });

// Plataformas de la marquesina: nombre y, si tiene, logo (se muestra la imagen en lugar del texto).
const plataforma = { nombre: "", logoUrl: "" };

export const defaultSettings = {
  marca: {
    nombre: "ZERG",
    // Vacío = usar el logo incluido en la tienda (public/zerg-logo.png)
    logoUrl: "",
    iconoUrl: "",
  },
  header: {
    anuncio: "Entrega inmediata 24/7",
    buscadorPlaceholder: "Buscar Netflix, Spotify, Canva...",
    mostrarOfertas: true,
    menu: listOf(itemMenu, [
      categoriaMenu("streaming"),
      categoriaMenu("musica"),
      categoriaMenu("ia"),
      categoriaMenu("diseno"),
      categoriaMenu("productividad"),
      {
        ...itemMenu,
        categoria: "gaming",
        desplegable: true,
        grupos: [
          {
            titulo: "Suscripciones",
            enlaces: [
              { etiqueta: "Xbox Game Pass", url: "/product/game-pass", imagenUrl: "" },
              { etiqueta: "PlayStation Plus", url: "/product/playstation-plus", imagenUrl: "" },
              { etiqueta: "Nintendo Switch Online", url: "/product/nintendo-switch-online", imagenUrl: "" },
              { etiqueta: "Discord Nitro", url: "/product/discord-nitro", imagenUrl: "" },
            ],
          },
          {
            titulo: "Tarjetas de regalo",
            enlaces: [{ etiqueta: "Steam Wallet", url: "/product/steam-wallet", imagenUrl: "" }],
          },
        ],
      },
    ]),
  },
  portada: {
    hero: {
      etiqueta: "Nuevos servicios cada semana",
      titulo: "Todo tu entretenimiento",
      tituloDestacado: "en un solo lugar",
      descripcion:
        "Streaming, música, inteligencia artificial y gaming al mejor precio. Compra en segundos y recibe tu acceso al instante.",
      ctaPrimarioTexto: "Ver catálogo",
      ctaPrimarioUrl: "/products",
      ctaSecundarioTexto: "Ver ofertas",
      ctaSecundarioUrl: "/products?ofertas=1",
    },
    destacado: {
      productoSlug: "netflix-premium",
      etiqueta: "Más vendido",
      descripcion: "Perfil privado en 4K, listo para usar en minutos.",
    },
    // Vacío = se eligen solos los productos con mejor descuento
    tendencias: [] as string[],
    spotlight: ["ia", "streaming", "diseno", "gaming"],
    carruseles: ["ia", "diseno", "streaming"],
    plataformas: listOf(
      plataforma,
      [
        "Netflix", "Disney+", "Max", "Prime Video", "Spotify", "YouTube", "Crunchyroll",
        "ChatGPT", "Canva", "Microsoft 365", "Xbox", "PlayStation", "NordVPN",
      ].map((nombre) => ({ ...plataforma, nombre }))
    ),
    secciones: {
      beneficios: true,
      masBuscado: true,
      tendencias: true,
      carruseles: true,
      plataformas: true,
      categorias: true,
      opiniones: true,
      recienLlegados: true,
      creceConZerg: true,
      boletin: true,
    },
  },
  contacto: {
    whatsapp: "",
    email: "soporte@zerg.store",
    horario: "Lun a Dom · 8:00 a 23:00",
  },
  footer: {
    descripcion:
      "Tu tienda de servicios digitales: streaming, música, IA y más, con entrega inmediata y soporte real.",
    metodosPago: ["Yape", "Plin", "VISA", "Mastercard", "PayPal", "Binance"],
  },
};

export type SiteSettings = typeof defaultSettings;
