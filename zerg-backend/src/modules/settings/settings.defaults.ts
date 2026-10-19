// Contenido por defecto de la tienda. Lo que se guarda desde el panel admin
// se combina con estos valores, así una clave nueva nunca deja la tienda vacía.
// Mantener sincronizado con zerg-frontend/lib/site-settings.ts.
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
    categoriasMenu: ["streaming", "musica", "ia", "diseno", "productividad", "gaming"],
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
    plataformas: [
      "Netflix", "Disney+", "Max", "Prime Video", "Spotify", "YouTube", "Crunchyroll",
      "ChatGPT", "Canva", "Microsoft 365", "Xbox", "PlayStation", "NordVPN",
    ],
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
