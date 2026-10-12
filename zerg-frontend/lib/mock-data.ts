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
  category("cat-ia", "Inteligencia Artificial", "ia", "Asistentes, generadores y herramientas de IA"),
  category("cat-diseno", "Diseño", "diseno", "Herramientas creativas, edición y recursos"),
  category("cat-productividad", "Productividad", "productividad", "Oficina, notas, idiomas y almacenamiento"),
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
  product("netflix-premium", "Netflix Premium", "cat-streaming", "Perfil privado en calidad 4K Ultra HD con audio espacial. Series, películas y documentales en cualquier dispositivo.", [["1 mes", 24.9, 29.9], ["3 meses", 67.9], ["6 meses", 128.9, 147.9]]),
  product("disney-plus", "Disney+ Premium", "cat-streaming", "Disney, Pixar, Marvel, Star Wars y National Geographic en un solo lugar, con calidad 4K.", [["1 mes", 16.9], ["3 meses", 47.9, 50.9]]),
  product("max-hbo", "Max", "cat-streaming", "Series originales de HBO, películas de Warner Bros. y lo mejor de DC.", [["1 mes", 18.9, 21.9], ["6 meses", 98.9]]),
  product("prime-video", "Prime Video", "cat-streaming", "Películas, series Amazon Originals y deportes en vivo.", [["1 mes", 14.9], ["12 meses", 147.9, 177.9]]),
  product("crunchyroll", "Crunchyroll Mega Fan", "cat-streaming", "El catálogo de anime más grande del mundo, sin anuncios y con estrenos simultáneos.", [["1 mes", 12.9], ["3 meses", 37.9]]),
  product("paramount-plus", "Paramount+", "cat-streaming", "Películas de Paramount, series originales y realities en un solo lugar.", [["1 mes", 12.9, 15.9], ["6 meses", 69.9]]),
  product("apple-tv-plus", "Apple TV+", "cat-streaming", "Series y películas originales de Apple premiadas, en 4K HDR.", [["1 mes", 17.9], ["3 meses", 49.9, 53.7]]),
  product("vix-premium", "ViX Premium", "cat-streaming", "Telenovelas, fútbol y el mejor contenido en español sin anuncios.", [["1 mes", 11.9], ["3 meses", 32.9]]),
  product("spotify-premium", "Spotify Premium", "cat-musica", "Música sin anuncios, descargas offline y saltos ilimitados en tu propia cuenta.", [["1 mes", 14.9, 18.9], ["3 meses", 40.9], ["12 meses", 147.9]]),
  product("youtube-premium", "YouTube Premium", "cat-musica", "YouTube sin anuncios, reproducción en segundo plano y YouTube Music incluido.", [["1 mes", 15.9], ["6 meses", 86.9, 95.4]]),
  product("apple-music", "Apple Music", "cat-musica", "Más de 100 millones de canciones con audio espacial y sin pérdida.", [["1 mes", 15.9], ["3 meses", 44.9, 47.7]]),
  product("deezer-premium", "Deezer Premium", "cat-musica", "Música en alta calidad, letras en tiempo real y Flow personalizado.", [["1 mes", 12.9], ["6 meses", 69.9, 77.4]]),
  product("tidal-hifi", "TIDAL HiFi", "cat-musica", "Audio de máxima fidelidad para audiófilos, sin anuncios.", [["1 mes", 17.9]]),
  product("chatgpt-plus", "ChatGPT Plus", "cat-ia", "Acceso a los modelos más avanzados de OpenAI, generación de imágenes, voz y análisis de archivos.", [["1 mes", 56.9, 75.9], ["3 meses", 164.9]]),
  product("chatgpt-pro", "ChatGPT Pro", "cat-ia", "Uso ilimitado de los modelos de razonamiento de OpenAI y acceso prioritario a funciones nuevas.", [["1 mes", 689.9, 759.9]]),
  product("chatgpt-team", "ChatGPT Team", "cat-ia", "Espacio de trabajo compartido para equipos con datos privados y más límites.", [["1 mes", 99.9, 113.9]]),
  product("claude-pro", "Claude Pro", "cat-ia", "Asistente de Anthropic ideal para escribir, programar y analizar documentos largos.", [["1 mes", 56.9, 75.9], ["3 meses", 164.9]]),
  product("claude-max", "Claude Max", "cat-ia", "Hasta 20 veces más uso que Pro y acceso prioritario a los modelos más nuevos de Anthropic.", [["1 mes", 379.9, 419.9]]),
  product("gemini-advanced", "Google AI Pro (Gemini)", "cat-ia", "Gemini avanzado de Google con 2 TB de almacenamiento y la IA integrada en Gmail y Docs.", [["1 mes", 49.9, 75.9], ["3 meses", 139.9]]),
  product("google-ai-ultra", "Google AI Ultra", "cat-ia", "El nivel más alto de Google: modelos más potentes, video con Veo y Deep Think.", [["1 mes", 899.9, 949.9]]),
  product("copilot-pro", "Microsoft Copilot Pro", "cat-ia", "Copilot dentro de Word, Excel, PowerPoint y Outlook, con acceso prioritario.", [["1 mes", 59.9, 75.9]]),
  product("perplexity-pro", "Perplexity Pro", "cat-ia", "Buscador con IA que cita sus fuentes, con modelos premium y análisis de archivos.", [["1 mes", 49.9, 75.9], ["12 meses", 449.9]]),
  product("supergrok", "SuperGrok", "cat-ia", "Grok de xAI con más uso, generación de imágenes y respuestas en tiempo real.", [["1 mes", 99.9, 113.9]]),
  product("mistral-le-chat-pro", "Le Chat Pro (Mistral AI)", "cat-ia", "El asistente francés de Mistral AI con búsqueda web, documentos y agentes.", [["1 mes", 54.9]]),
  product("deepseek-api", "DeepSeek API (créditos)", "cat-ia", "Créditos para usar los modelos de DeepSeek vía API en tus proyectos.", [["S/ 50 en créditos", 54.9], ["S/ 100 en créditos", 104.9]]),
  product("kimi-plus", "Kimi (Moonshot AI)", "cat-ia", "Asistente chino de Moonshot AI con ventana de contexto gigante para documentos.", [["1 mes", 39.9]]),
  product("qwen-plus", "Qwen Chat Plus (Alibaba)", "cat-ia", "Los modelos Qwen de Alibaba con más uso, visión y generación de imágenes.", [["1 mes", 34.9]]),
  product("poe-subscription", "Poe", "cat-ia", "Muchos modelos de IA en una sola app: GPT, Claude, Gemini, Llama y más.", [["1 mes", 59.9, 75.9]]),
  product("you-com-pro", "You.com Pro", "cat-ia", "Búsqueda y asistente con IA con acceso a varios modelos premium.", [["1 mes", 54.9, 75.9]]),
  product("character-ai-plus", "c.ai+ (Character.AI)", "cat-ia", "Conversa con personajes de IA más rápido, sin esperas y con memoria mejorada.", [["1 mes", 29.9, 37.9]]),
  product("manus-pro", "Manus", "cat-ia", "Agente autónomo de IA que investiga, crea documentos y ejecuta tareas por ti.", [["1 mes", 149.9]]),
  product("midjourney", "Midjourney", "cat-ia", "El generador de imágenes con IA más artístico del mundo.", [["Basic · 1 mes", 39.9], ["Standard · 1 mes", 109.9], ["Pro · 1 mes", 219.9]]),
  product("leonardo-ai", "Leonardo.Ai", "cat-ia", "Genera imágenes, assets para juegos y video con modelos propios.", [["1 mes", 44.9], ["12 meses", 449.9, 538.8]]),
  product("ideogram", "Ideogram", "cat-ia", "Imágenes con IA que escriben texto perfecto: logos, pósters y diseños.", [["1 mes", 32.9]]),
  product("krea-ai", "Krea AI", "cat-ia", "Generación y mejora de imágenes en tiempo real, video y escalado.", [["1 mes", 39.9]]),
  product("runway", "Runway", "cat-ia", "Crea y edita video con IA generativa: Gen-4, eliminación de fondos y más.", [["1 mes", 54.9], ["12 meses", 539.9, 658.8]]),
  product("pika", "Pika", "cat-ia", "Convierte texto e imágenes en videos cortos con efectos creativos.", [["1 mes", 39.9]]),
  product("kling-ai", "Kling AI", "cat-ia", "El generador de video chino de Kuaishou con movimiento realista y 1080p.", [["1 mes", 39.9, 49.9], ["3 meses", 109.9]]),
  product("hailuo-ai", "Hailuo AI (MiniMax)", "cat-ia", "Video con IA de MiniMax: escenas cinematográficas a partir de texto o imagen.", [["1 mes", 39.9]]),
  product("luma-dream-machine", "Luma Dream Machine", "cat-ia", "Video y 3D con IA de alta calidad a partir de tus ideas.", [["1 mes", 39.9]]),
  product("heygen", "HeyGen", "cat-ia", "Avatares de video con IA, traducción de video y doblaje automático.", [["1 mes", 109.9]]),
  product("synthesia", "Synthesia", "cat-ia", "Videos profesionales con presentadores de IA en más de 140 idiomas.", [["1 mes", 109.9]]),
  product("elevenlabs", "ElevenLabs", "cat-ia", "Voces de IA ultra realistas, clonación de voz y doblaje en 30 idiomas.", [["Starter · 1 mes", 19.9], ["Creator · 1 mes", 79.9, 94.9]]),
  product("suno", "Suno", "cat-ia", "Crea canciones completas con voz y música a partir de una frase.", [["1 mes", 37.9], ["12 meses", 359.9, 454.8]]),
  product("udio", "Udio", "cat-ia", "Genera música original de alta calidad en cualquier género.", [["1 mes", 37.9]]),
  product("github-copilot", "GitHub Copilot Pro", "cat-ia", "Tu programador en pareja con IA dentro de VS Code y JetBrains.", [["1 mes", 37.9], ["12 meses", 379.9, 454.8]]),
  product("cursor-pro", "Cursor Pro", "cat-ia", "El editor de código con IA que entiende todo tu proyecto.", [["1 mes", 75.9]]),
  product("windsurf-pro", "Windsurf Pro", "cat-ia", "Editor de código agéntico con IA para programar más rápido.", [["1 mes", 56.9]]),
  product("notion-ai", "Notion AI", "cat-ia", "Escribe, resume y organiza tus notas con IA dentro de Notion.", [["1 mes", 37.9]]),
  product("grammarly-premium", "Grammarly Premium", "cat-ia", "Corrector con IA para inglés: gramática, tono y reescritura.", [["1 mes", 44.9, 113.9], ["12 meses", 229.9]]),
  product("quillbot-premium", "QuillBot Premium", "cat-ia", "Parafraseador, resumidor y corrector con IA para trabajos académicos.", [["1 mes", 29.9, 37.9], ["12 meses", 149.9]]),
  product("deepl-pro", "DeepL Pro", "cat-ia", "El traductor con IA más preciso, con traducción de documentos completos.", [["1 mes", 34.9], ["12 meses", 329.9]]),
  product("jasper-ai", "Jasper", "cat-ia", "Redacción de marketing con IA que respeta la voz de tu marca.", [["1 mes", 149.9]]),
  product("gamma-pro", "Gamma Pro", "cat-ia", "Crea presentaciones, documentos y webs con IA en segundos.", [["1 mes", 59.9]]),
  product("otter-ai", "Otter.ai Pro", "cat-ia", "Transcribe y resume tus reuniones automáticamente con IA.", [["1 mes", 64.9]]),
  product("canva-pro", "Canva Pro", "cat-diseno", "Plantillas premium, kit de marca, quitar fondos y millones de recursos.", [["1 mes", 10.9], ["12 meses", 94.9, 130.8]]),
  product("adobe-creative-cloud", "Adobe Creative Cloud", "cat-diseno", "Todas las apps de Adobe: Photoshop, Illustrator, Premiere, After Effects y más.", [["1 mes", 89.9, 229.9], ["12 meses", 899.9]]),
  product("adobe-photoshop", "Adobe Photoshop", "cat-diseno", "El editor de imágenes estándar de la industria, con relleno generativo con IA.", [["1 mes", 49.9, 85.9]]),
  product("adobe-illustrator", "Adobe Illustrator", "cat-diseno", "Diseño vectorial profesional para logos, ilustraciones y tipografía.", [["1 mes", 49.9, 85.9]]),
  product("adobe-premiere-pro", "Adobe Premiere Pro", "cat-diseno", "Edición de video profesional para cine, YouTube y redes sociales.", [["1 mes", 49.9, 85.9]]),
  product("adobe-after-effects", "Adobe After Effects", "cat-diseno", "Animación y efectos visuales de nivel profesional.", [["1 mes", 49.9, 85.9]]),
  product("adobe-lightroom", "Adobe Lightroom", "cat-diseno", "Edita y organiza tus fotos desde el celular o la computadora.", [["1 mes", 29.9, 45.9]]),
  product("adobe-express", "Adobe Express Premium", "cat-diseno", "Crea contenido para redes rápidamente con plantillas y Firefly.", [["1 mes", 19.9, 37.9]]),
  product("adobe-stock", "Adobe Stock", "cat-diseno", "Millones de fotos, videos, vectores y plantillas con licencia.", [["10 descargas · 1 mes", 59.9, 113.9]]),
  product("figma-professional", "Figma Professional", "cat-diseno", "Diseño de interfaces y prototipos colaborativos en tiempo real.", [["1 mes", 49.9], ["12 meses", 489.9]]),
  product("framer-pro", "Framer", "cat-diseno", "Diseña y publica sitios web sin código, con animaciones y CMS.", [["1 mes", 59.9]]),
  product("sketch", "Sketch", "cat-diseno", "La herramienta clásica de diseño de interfaces para Mac.", [["1 mes", 39.9]]),
  product("spline-pro", "Spline", "cat-diseno", "Diseño 3D interactivo en el navegador para webs y apps.", [["1 mes", 49.9]]),
  product("affinity", "Affinity (Designer, Photo, Publisher)", "cat-diseno", "Suite creativa profesional sin suscripción: vectores, fotos y maquetación.", [["Licencia de por vida", 299.9, 449.9]]),
  product("coreldraw", "CorelDRAW Graphics Suite", "cat-diseno", "Diseño gráfico vectorial, maquetación y edición de fotos.", [["12 meses", 449.9, 1049.9]]),
  product("procreate", "Procreate", "cat-diseno", "La app de ilustración favorita en iPad, pago único.", [["Licencia de por vida", 54.9]]),
  product("clip-studio-paint", "Clip Studio Paint EX", "cat-diseno", "Ilustración, manga, cómic y animación profesional.", [["12 meses", 149.9]]),
  product("davinci-resolve-studio", "DaVinci Resolve Studio", "cat-diseno", "Edición, color, efectos y audio profesional en un solo programa.", [["Licencia de por vida", 649.9, 1139.9]]),
  product("capcut-pro", "CapCut Pro", "cat-diseno", "Edición de video profesional con efectos, plantillas y exportación sin marca de agua.", [["1 mes", 14.9], ["12 meses", 119.9]]),
  product("picsart-gold", "Picsart Gold", "cat-diseno", "Edición de fotos y videos con IA, stickers y plantillas premium.", [["1 mes", 14.9], ["12 meses", 99.9]]),
  product("vsco-plus", "VSCO Plus", "cat-diseno", "Filtros de cine y herramientas avanzadas de edición de fotos.", [["12 meses", 79.9]]),
  product("remini-pro", "Remini Pro", "cat-diseno", "Mejora fotos borrosas y antiguas con IA en un toque.", [["1 mes", 19.9]]),
  product("freepik-premium", "Freepik Premium", "cat-diseno", "Millones de vectores, fotos, PSD e íconos, más generador de imágenes con IA.", [["1 mes", 29.9, 45.9], ["12 meses", 249.9]]),
  product("envato-elements", "Envato Elements", "cat-diseno", "Descargas ilimitadas de plantillas, fuentes, música y videos.", [["1 mes", 29.9, 62.9], ["12 meses", 299.9]]),
  product("shutterstock", "Shutterstock", "cat-diseno", "Imágenes y videos de stock de alta calidad con licencia comercial.", [["10 imágenes · 1 mes", 109.9]]),
  product("motion-array", "Motion Array", "cat-diseno", "Plantillas de video, presets, música y efectos de sonido ilimitados.", [["1 mes", 39.9]]),
  product("artlist", "Artlist", "cat-diseno", "Música y efectos de sonido sin derechos para tus videos.", [["12 meses", 449.9]]),
  product("epidemic-sound", "Epidemic Sound", "cat-diseno", "Música para creadores de contenido sin reclamos de copyright.", [["1 mes", 39.9]]),
  product("storyblocks", "Storyblocks", "cat-diseno", "Video, audio e imágenes de stock ilimitados.", [["1 mes", 49.9]]),
  product("placeit", "Placeit", "cat-diseno", "Mockups, logos y videos promocionales en minutos.", [["1 mes", 39.9]]),
  product("creative-market", "Creative Market", "cat-diseno", "Fuentes, plantillas y gráficos de diseñadores independientes.", [["Créditos S/ 50", 54.9]]),
  product("pixlr-premium", "Pixlr Premium", "cat-diseno", "Editor de fotos online con herramientas de IA.", [["1 mes", 14.9]]),
  product("microsoft-365", "Microsoft 365", "cat-productividad", "Word, Excel, PowerPoint y 1 TB en OneDrive para tu cuenta personal.", [["12 meses", 75.9, 113.9]]),
  product("google-one", "Google One 2 TB", "cat-productividad", "Almacenamiento compartido para Gmail, Drive y Fotos.", [["1 mes", 15.9], ["12 meses", 149.9]]),
  product("duolingo-max", "Duolingo Super", "cat-productividad", "Aprende idiomas sin anuncios, con vidas ilimitadas y práctica personalizada.", [["12 meses", 59.9]]),
  product("notion-plus", "Notion Plus", "cat-productividad", "Espacio de trabajo para notas, tareas y wikis sin límites.", [["1 mes", 37.9]]),
  product("todoist-pro", "Todoist Pro", "cat-productividad", "Organiza tus tareas y proyectos con recordatorios y filtros.", [["12 meses", 149.9]]),
  product("linkedin-premium", "LinkedIn Premium Career", "cat-productividad", "Destaca en búsquedas de empleo y accede a LinkedIn Learning.", [["1 mes", 59.9, 113.9]]),
  product("game-pass", "Xbox Game Pass Ultimate", "cat-gaming", "Cientos de juegos en consola, PC y la nube, más EA Play incluido.", [["1 mes", 37.9, 56.9], ["3 meses", 105.9]]),
  product("playstation-plus", "PlayStation Plus Extra", "cat-gaming", "Catálogo de juegos de PS4 y PS5, multijugador en línea y descuentos exclusivos.", [["1 mes", 35.9], ["12 meses", 337.9, 474.9]]),
  product("nintendo-switch-online", "Nintendo Switch Online", "cat-gaming", "Juego en línea, clásicos de NES y SNES y guardado en la nube.", [["12 meses", 79.9]]),
  product("discord-nitro", "Discord Nitro", "cat-gaming", "Emojis personalizados, mejoras de servidor y transmisión en HD.", [["1 mes", 29.9, 37.9], ["12 meses", 299.9]]),
  product("steam-wallet", "Tarjeta Steam", "cat-gaming", "Saldo para comprar juegos y contenido en Steam.", [["S/ 50", 54.9], ["S/ 100", 104.9]]),
  product("nordvpn", "NordVPN", "cat-seguridad", "VPN rápida y segura para hasta 10 dispositivos, con bloqueo de anuncios y malware.", [["1 mes", 14.9], ["12 meses", 113.9, 177.9]]),
  product("expressvpn", "ExpressVPN", "cat-seguridad", "VPN premium con servidores en 105 países y velocidad máxima.", [["1 mes", 24.9], ["12 meses", 199.9]]),
  product("surfshark", "Surfshark", "cat-seguridad", "VPN para dispositivos ilimitados con antivirus incluido.", [["12 meses", 89.9]]),
  product("kaspersky-premium", "Kaspersky Premium", "cat-seguridad", "Antivirus, protección de pagos y gestor de contraseñas.", [["12 meses", 99.9, 149.9]]),
  product("bitdefender-total", "Bitdefender Total Security", "cat-seguridad", "Protección completa para Windows, Mac, Android e iOS.", [["12 meses", 89.9]]),
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
