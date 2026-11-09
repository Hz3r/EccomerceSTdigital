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

// Cuenta bancaria para el pago directo por transferencia.
const cuentaBancaria = { banco: "", titular: "", numero: "", cci: "" };

// Plataformas de la marquesina: nombre y, si tiene, logo (se muestra la imagen en lugar del texto).
const plataforma = { nombre: "", logoUrl: "" };

// Logos pequeños bajo cada método de pago (VISA, Yape…). Sin imagen se muestra el nombre.
const logoPago = { nombre: "", logoUrl: "" };
const logos = (...nombres: string[]) => listOf(logoPago, nombres.map((nombre) => ({ ...logoPago, nombre })));

// Columna de "Recién llegados": muestra los últimos productos de sus categorías.
// Si `productos` tiene elementos, se muestran esos (en ese orden) en lugar de los automáticos.
// `icono` es el slug de un ícono de categoría (vacío = el de la primera categoría); `color` es el borde superior.
const columnaRecientes = { titulo: "", icono: "", color: "verde", categorias: [] as string[], productos: [] as string[] };
const columna = (titulo: string, icono: string, color: string, categorias: string[]) => ({
  ...columnaRecientes,
  titulo,
  icono,
  color,
  categorias,
  productos: [],
});

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
    boletin: {
      titulo: "Suscríbete a nuestro boletín",
      descripcion: "Recibe primero las ofertas, combos y nuevos servicios. Un correo a la semana, sin spam.",
      boton: "Suscribirme",
      mensajeExito: "¡Listo! Te avisaremos de las próximas ofertas.",
    },
    recienLlegados: {
      titulo: "Recién llegados",
      subtitulo: "Los últimos servicios que sumamos al catálogo",
      // Productos por columna (1 a 12)
      cantidad: 8,
      columnas: listOf(columnaRecientes, [
        columna("Inteligencia Artificial", "ia", "verde", ["ia"]),
        columna("Diseño y creatividad", "diseno", "amarillo", ["diseno"]),
        columna("Streaming y música", "streaming", "neon", ["streaming", "musica"]),
        columna("Gaming y más", "gaming", "azul", ["gaming", "productividad", "seguridad"]),
      ]),
    },
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
  pagos: {
    // Pago directo: Yape, Plin o transferencia; el cliente sube el comprobante y el admin lo confirma.
    directo: {
      activo: true,
      titular: "",
      yape: "",
      plin: "",
      // Imagen del QR de Yape/Plin (subida desde el admin)
      qrUrl: "",
      instrucciones:
        "Paga el monto exacto y sube la captura del pago con el número de operación. Lo confirmamos en minutos y te enviamos tus accesos.",
      cuentas: listOf(cuentaBancaria),
    },
    // Soles por 1 USDT para cobrar con Binance Pay (los precios de la tienda están en soles).
    tipoCambioUsdt: 3.75,
    // Formulario de Izipay: "tarjeta" = el formulario de tarjeta abierto directamente;
    // "lista" = primero la lista de medios activos (Tarjeta, Yape, QR…) con sus logos.
    izipayModo: "tarjeta",
    // Logos que se ven bajo cada método en el checkout y en el pago (se editan en Admin → Pagos).
    logos: {
      directo: logos("Yape", "Plin", "BCP", "Interbank"),
      izipay: logos("VISA", "Mastercard", "American Express", "Diners Club"),
      binance: logos("Binance", "USDT"),
    },
  },
  // Google Analytics 4: ID de medición "G-XXXXXXX" (Admin → Analítica). Vacío = no se carga nada de Google.
  analytics: {
    googleId: "",
  },
  contacto: {
    whatsapp: "",
    // Mensaje que ya va escrito al abrir WhatsApp desde el chat de ayuda.
    // {tienda} = nombre de la marca; {cliente} = " (soy Nombre)" si el cliente inició sesión.
    whatsappMensaje: "Hola {tienda}, necesito ayuda{cliente}.",
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
