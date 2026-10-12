// Catálogo de ejemplo de la tienda (precios en soles). Lo usa prisma/seed.ts.
// Mantener sincronizado con zerg-frontend/lib/mock-data.ts (modo diseño).

export interface SeedPlan {
  nombre: string;
  slug: string;
  duracion: string;
  precio: number;
  precioOriginal?: number;
}

export interface SeedProduct {
  nombre: string;
  slug: string;
  categoria: string;
  descripcion: string;
  plans: SeedPlan[];
}

export const seedCategories = [
  { slug: "streaming", nombre: "Streaming", descripcion: "Películas, series y TV en vivo" },
  { slug: "musica", nombre: "Música", descripcion: "Música y podcasts sin anuncios" },
  { slug: "ia", nombre: "Inteligencia Artificial", descripcion: "Asistentes, generadores y herramientas de IA" },
  { slug: "diseno", nombre: "Diseño", descripcion: "Herramientas creativas, edición y recursos" },
  { slug: "productividad", nombre: "Productividad", descripcion: "Oficina, notas, idiomas y almacenamiento" },
  { slug: "gaming", nombre: "Gaming", descripcion: "Suscripciones y tarjetas para gamers" },
  { slug: "seguridad", nombre: "VPN y Seguridad", descripcion: "Navega seguro y sin límites" },
];

export const seedProducts: SeedProduct[] = [
  {
    nombre: "Netflix Premium",
    slug: "netflix-premium",
    categoria: "streaming",
    descripcion: "Perfil privado en calidad 4K Ultra HD con audio espacial. Series, películas y documentales en cualquier dispositivo.",
    plans: [
      { nombre: "1 mes", slug: "netflix-premium-1-mes", duracion: "1 mes", precio: 24.9, precioOriginal: 29.9 },
      { nombre: "3 meses", slug: "netflix-premium-3-meses", duracion: "3 meses", precio: 67.9 },
      { nombre: "6 meses", slug: "netflix-premium-6-meses", duracion: "6 meses", precio: 128.9, precioOriginal: 147.9 },
    ],
  },
  {
    nombre: "Disney+ Premium",
    slug: "disney-plus",
    categoria: "streaming",
    descripcion: "Disney, Pixar, Marvel, Star Wars y National Geographic en un solo lugar, con calidad 4K.",
    plans: [
      { nombre: "1 mes", slug: "disney-plus-1-mes", duracion: "1 mes", precio: 16.9 },
      { nombre: "3 meses", slug: "disney-plus-3-meses", duracion: "3 meses", precio: 47.9, precioOriginal: 50.9 },
    ],
  },
  {
    nombre: "Max",
    slug: "max-hbo",
    categoria: "streaming",
    descripcion: "Series originales de HBO, películas de Warner Bros. y lo mejor de DC.",
    plans: [
      { nombre: "1 mes", slug: "max-hbo-1-mes", duracion: "1 mes", precio: 18.9, precioOriginal: 21.9 },
      { nombre: "6 meses", slug: "max-hbo-6-meses", duracion: "6 meses", precio: 98.9 },
    ],
  },
  {
    nombre: "Prime Video",
    slug: "prime-video",
    categoria: "streaming",
    descripcion: "Películas, series Amazon Originals y deportes en vivo.",
    plans: [
      { nombre: "1 mes", slug: "prime-video-1-mes", duracion: "1 mes", precio: 14.9 },
      { nombre: "12 meses", slug: "prime-video-12-meses", duracion: "12 meses", precio: 147.9, precioOriginal: 177.9 },
    ],
  },
  {
    nombre: "Crunchyroll Mega Fan",
    slug: "crunchyroll",
    categoria: "streaming",
    descripcion: "El catálogo de anime más grande del mundo, sin anuncios y con estrenos simultáneos.",
    plans: [
      { nombre: "1 mes", slug: "crunchyroll-1-mes", duracion: "1 mes", precio: 12.9 },
      { nombre: "3 meses", slug: "crunchyroll-3-meses", duracion: "3 meses", precio: 37.9 },
    ],
  },
  {
    nombre: "Paramount+",
    slug: "paramount-plus",
    categoria: "streaming",
    descripcion: "Películas de Paramount, series originales y realities en un solo lugar.",
    plans: [
      { nombre: "1 mes", slug: "paramount-plus-1-mes", duracion: "1 mes", precio: 12.9, precioOriginal: 15.9 },
      { nombre: "6 meses", slug: "paramount-plus-6-meses", duracion: "6 meses", precio: 69.9 },
    ],
  },
  {
    nombre: "Apple TV+",
    slug: "apple-tv-plus",
    categoria: "streaming",
    descripcion: "Series y películas originales de Apple premiadas, en 4K HDR.",
    plans: [
      { nombre: "1 mes", slug: "apple-tv-plus-1-mes", duracion: "1 mes", precio: 17.9 },
      { nombre: "3 meses", slug: "apple-tv-plus-3-meses", duracion: "3 meses", precio: 49.9, precioOriginal: 53.7 },
    ],
  },
  {
    nombre: "ViX Premium",
    slug: "vix-premium",
    categoria: "streaming",
    descripcion: "Telenovelas, fútbol y el mejor contenido en español sin anuncios.",
    plans: [
      { nombre: "1 mes", slug: "vix-premium-1-mes", duracion: "1 mes", precio: 11.9 },
      { nombre: "3 meses", slug: "vix-premium-3-meses", duracion: "3 meses", precio: 32.9 },
    ],
  },
  {
    nombre: "Spotify Premium",
    slug: "spotify-premium",
    categoria: "musica",
    descripcion: "Música sin anuncios, descargas offline y saltos ilimitados en tu propia cuenta.",
    plans: [
      { nombre: "1 mes", slug: "spotify-premium-1-mes", duracion: "1 mes", precio: 14.9, precioOriginal: 18.9 },
      { nombre: "3 meses", slug: "spotify-premium-3-meses", duracion: "3 meses", precio: 40.9 },
      { nombre: "12 meses", slug: "spotify-premium-12-meses", duracion: "12 meses", precio: 147.9 },
    ],
  },
  {
    nombre: "YouTube Premium",
    slug: "youtube-premium",
    categoria: "musica",
    descripcion: "YouTube sin anuncios, reproducción en segundo plano y YouTube Music incluido.",
    plans: [
      { nombre: "1 mes", slug: "youtube-premium-1-mes", duracion: "1 mes", precio: 15.9 },
      { nombre: "6 meses", slug: "youtube-premium-6-meses", duracion: "6 meses", precio: 86.9, precioOriginal: 95.4 },
    ],
  },
  {
    nombre: "Apple Music",
    slug: "apple-music",
    categoria: "musica",
    descripcion: "Más de 100 millones de canciones con audio espacial y sin pérdida.",
    plans: [
      { nombre: "1 mes", slug: "apple-music-1-mes", duracion: "1 mes", precio: 15.9 },
      { nombre: "3 meses", slug: "apple-music-3-meses", duracion: "3 meses", precio: 44.9, precioOriginal: 47.7 },
    ],
  },
  {
    nombre: "Deezer Premium",
    slug: "deezer-premium",
    categoria: "musica",
    descripcion: "Música en alta calidad, letras en tiempo real y Flow personalizado.",
    plans: [
      { nombre: "1 mes", slug: "deezer-premium-1-mes", duracion: "1 mes", precio: 12.9 },
      { nombre: "6 meses", slug: "deezer-premium-6-meses", duracion: "6 meses", precio: 69.9, precioOriginal: 77.4 },
    ],
  },
  {
    nombre: "TIDAL HiFi",
    slug: "tidal-hifi",
    categoria: "musica",
    descripcion: "Audio de máxima fidelidad para audiófilos, sin anuncios.",
    plans: [
      { nombre: "1 mes", slug: "tidal-hifi-1-mes", duracion: "1 mes", precio: 17.9 },
    ],
  },
  {
    nombre: "ChatGPT Plus",
    slug: "chatgpt-plus",
    categoria: "ia",
    descripcion: "Acceso a los modelos más avanzados de OpenAI, generación de imágenes, voz y análisis de archivos.",
    plans: [
      { nombre: "1 mes", slug: "chatgpt-plus-1-mes", duracion: "1 mes", precio: 56.9, precioOriginal: 75.9 },
      { nombre: "3 meses", slug: "chatgpt-plus-3-meses", duracion: "3 meses", precio: 164.9 },
    ],
  },
  {
    nombre: "ChatGPT Pro",
    slug: "chatgpt-pro",
    categoria: "ia",
    descripcion: "Uso ilimitado de los modelos de razonamiento de OpenAI y acceso prioritario a funciones nuevas.",
    plans: [
      { nombre: "1 mes", slug: "chatgpt-pro-1-mes", duracion: "1 mes", precio: 689.9, precioOriginal: 759.9 },
    ],
  },
  {
    nombre: "ChatGPT Team",
    slug: "chatgpt-team",
    categoria: "ia",
    descripcion: "Espacio de trabajo compartido para equipos con datos privados y más límites.",
    plans: [
      { nombre: "1 mes", slug: "chatgpt-team-1-mes", duracion: "1 mes", precio: 99.9, precioOriginal: 113.9 },
    ],
  },
  {
    nombre: "Claude Pro",
    slug: "claude-pro",
    categoria: "ia",
    descripcion: "Asistente de Anthropic ideal para escribir, programar y analizar documentos largos.",
    plans: [
      { nombre: "1 mes", slug: "claude-pro-1-mes", duracion: "1 mes", precio: 56.9, precioOriginal: 75.9 },
      { nombre: "3 meses", slug: "claude-pro-3-meses", duracion: "3 meses", precio: 164.9 },
    ],
  },
  {
    nombre: "Claude Max",
    slug: "claude-max",
    categoria: "ia",
    descripcion: "Hasta 20 veces más uso que Pro y acceso prioritario a los modelos más nuevos de Anthropic.",
    plans: [
      { nombre: "1 mes", slug: "claude-max-1-mes", duracion: "1 mes", precio: 379.9, precioOriginal: 419.9 },
    ],
  },
  {
    nombre: "Google AI Pro (Gemini)",
    slug: "gemini-advanced",
    categoria: "ia",
    descripcion: "Gemini avanzado de Google con 2 TB de almacenamiento y la IA integrada en Gmail y Docs.",
    plans: [
      { nombre: "1 mes", slug: "gemini-advanced-1-mes", duracion: "1 mes", precio: 49.9, precioOriginal: 75.9 },
      { nombre: "3 meses", slug: "gemini-advanced-3-meses", duracion: "3 meses", precio: 139.9 },
    ],
  },
  {
    nombre: "Google AI Ultra",
    slug: "google-ai-ultra",
    categoria: "ia",
    descripcion: "El nivel más alto de Google: modelos más potentes, video con Veo y Deep Think.",
    plans: [
      { nombre: "1 mes", slug: "google-ai-ultra-1-mes", duracion: "1 mes", precio: 899.9, precioOriginal: 949.9 },
    ],
  },
  {
    nombre: "Microsoft Copilot Pro",
    slug: "copilot-pro",
    categoria: "ia",
    descripcion: "Copilot dentro de Word, Excel, PowerPoint y Outlook, con acceso prioritario.",
    plans: [
      { nombre: "1 mes", slug: "copilot-pro-1-mes", duracion: "1 mes", precio: 59.9, precioOriginal: 75.9 },
    ],
  },
  {
    nombre: "Perplexity Pro",
    slug: "perplexity-pro",
    categoria: "ia",
    descripcion: "Buscador con IA que cita sus fuentes, con modelos premium y análisis de archivos.",
    plans: [
      { nombre: "1 mes", slug: "perplexity-pro-1-mes", duracion: "1 mes", precio: 49.9, precioOriginal: 75.9 },
      { nombre: "12 meses", slug: "perplexity-pro-12-meses", duracion: "12 meses", precio: 449.9 },
    ],
  },
  {
    nombre: "SuperGrok",
    slug: "supergrok",
    categoria: "ia",
    descripcion: "Grok de xAI con más uso, generación de imágenes y respuestas en tiempo real.",
    plans: [
      { nombre: "1 mes", slug: "supergrok-1-mes", duracion: "1 mes", precio: 99.9, precioOriginal: 113.9 },
    ],
  },
  {
    nombre: "Le Chat Pro (Mistral AI)",
    slug: "mistral-le-chat-pro",
    categoria: "ia",
    descripcion: "El asistente francés de Mistral AI con búsqueda web, documentos y agentes.",
    plans: [
      { nombre: "1 mes", slug: "mistral-le-chat-pro-1-mes", duracion: "1 mes", precio: 54.9 },
    ],
  },
  {
    nombre: "DeepSeek API (créditos)",
    slug: "deepseek-api",
    categoria: "ia",
    descripcion: "Créditos para usar los modelos de DeepSeek vía API en tus proyectos.",
    plans: [
      { nombre: "S/ 50 en créditos", slug: "deepseek-api-s-50-en-creditos", duracion: "S/ 50 en créditos", precio: 54.9 },
      { nombre: "S/ 100 en créditos", slug: "deepseek-api-s-100-en-creditos", duracion: "S/ 100 en créditos", precio: 104.9 },
    ],
  },
  {
    nombre: "Kimi (Moonshot AI)",
    slug: "kimi-plus",
    categoria: "ia",
    descripcion: "Asistente chino de Moonshot AI con ventana de contexto gigante para documentos.",
    plans: [
      { nombre: "1 mes", slug: "kimi-plus-1-mes", duracion: "1 mes", precio: 39.9 },
    ],
  },
  {
    nombre: "Qwen Chat Plus (Alibaba)",
    slug: "qwen-plus",
    categoria: "ia",
    descripcion: "Los modelos Qwen de Alibaba con más uso, visión y generación de imágenes.",
    plans: [
      { nombre: "1 mes", slug: "qwen-plus-1-mes", duracion: "1 mes", precio: 34.9 },
    ],
  },
  {
    nombre: "Poe",
    slug: "poe-subscription",
    categoria: "ia",
    descripcion: "Muchos modelos de IA en una sola app: GPT, Claude, Gemini, Llama y más.",
    plans: [
      { nombre: "1 mes", slug: "poe-subscription-1-mes", duracion: "1 mes", precio: 59.9, precioOriginal: 75.9 },
    ],
  },
  {
    nombre: "You.com Pro",
    slug: "you-com-pro",
    categoria: "ia",
    descripcion: "Búsqueda y asistente con IA con acceso a varios modelos premium.",
    plans: [
      { nombre: "1 mes", slug: "you-com-pro-1-mes", duracion: "1 mes", precio: 54.9, precioOriginal: 75.9 },
    ],
  },
  {
    nombre: "c.ai+ (Character.AI)",
    slug: "character-ai-plus",
    categoria: "ia",
    descripcion: "Conversa con personajes de IA más rápido, sin esperas y con memoria mejorada.",
    plans: [
      { nombre: "1 mes", slug: "character-ai-plus-1-mes", duracion: "1 mes", precio: 29.9, precioOriginal: 37.9 },
    ],
  },
  {
    nombre: "Manus",
    slug: "manus-pro",
    categoria: "ia",
    descripcion: "Agente autónomo de IA que investiga, crea documentos y ejecuta tareas por ti.",
    plans: [
      { nombre: "1 mes", slug: "manus-pro-1-mes", duracion: "1 mes", precio: 149.9 },
    ],
  },
  {
    nombre: "Midjourney",
    slug: "midjourney",
    categoria: "ia",
    descripcion: "El generador de imágenes con IA más artístico del mundo.",
    plans: [
      { nombre: "Basic · 1 mes", slug: "midjourney-basic-1-mes", duracion: "Basic · 1 mes", precio: 39.9 },
      { nombre: "Standard · 1 mes", slug: "midjourney-standard-1-mes", duracion: "Standard · 1 mes", precio: 109.9 },
      { nombre: "Pro · 1 mes", slug: "midjourney-pro-1-mes", duracion: "Pro · 1 mes", precio: 219.9 },
    ],
  },
  {
    nombre: "Leonardo.Ai",
    slug: "leonardo-ai",
    categoria: "ia",
    descripcion: "Genera imágenes, assets para juegos y video con modelos propios.",
    plans: [
      { nombre: "1 mes", slug: "leonardo-ai-1-mes", duracion: "1 mes", precio: 44.9 },
      { nombre: "12 meses", slug: "leonardo-ai-12-meses", duracion: "12 meses", precio: 449.9, precioOriginal: 538.8 },
    ],
  },
  {
    nombre: "Ideogram",
    slug: "ideogram",
    categoria: "ia",
    descripcion: "Imágenes con IA que escriben texto perfecto: logos, pósters y diseños.",
    plans: [
      { nombre: "1 mes", slug: "ideogram-1-mes", duracion: "1 mes", precio: 32.9 },
    ],
  },
  {
    nombre: "Krea AI",
    slug: "krea-ai",
    categoria: "ia",
    descripcion: "Generación y mejora de imágenes en tiempo real, video y escalado.",
    plans: [
      { nombre: "1 mes", slug: "krea-ai-1-mes", duracion: "1 mes", precio: 39.9 },
    ],
  },
  {
    nombre: "Runway",
    slug: "runway",
    categoria: "ia",
    descripcion: "Crea y edita video con IA generativa: Gen-4, eliminación de fondos y más.",
    plans: [
      { nombre: "1 mes", slug: "runway-1-mes", duracion: "1 mes", precio: 54.9 },
      { nombre: "12 meses", slug: "runway-12-meses", duracion: "12 meses", precio: 539.9, precioOriginal: 658.8 },
    ],
  },
  {
    nombre: "Pika",
    slug: "pika",
    categoria: "ia",
    descripcion: "Convierte texto e imágenes en videos cortos con efectos creativos.",
    plans: [
      { nombre: "1 mes", slug: "pika-1-mes", duracion: "1 mes", precio: 39.9 },
    ],
  },
  {
    nombre: "Kling AI",
    slug: "kling-ai",
    categoria: "ia",
    descripcion: "El generador de video chino de Kuaishou con movimiento realista y 1080p.",
    plans: [
      { nombre: "1 mes", slug: "kling-ai-1-mes", duracion: "1 mes", precio: 39.9, precioOriginal: 49.9 },
      { nombre: "3 meses", slug: "kling-ai-3-meses", duracion: "3 meses", precio: 109.9 },
    ],
  },
  {
    nombre: "Hailuo AI (MiniMax)",
    slug: "hailuo-ai",
    categoria: "ia",
    descripcion: "Video con IA de MiniMax: escenas cinematográficas a partir de texto o imagen.",
    plans: [
      { nombre: "1 mes", slug: "hailuo-ai-1-mes", duracion: "1 mes", precio: 39.9 },
    ],
  },
  {
    nombre: "Luma Dream Machine",
    slug: "luma-dream-machine",
    categoria: "ia",
    descripcion: "Video y 3D con IA de alta calidad a partir de tus ideas.",
    plans: [
      { nombre: "1 mes", slug: "luma-dream-machine-1-mes", duracion: "1 mes", precio: 39.9 },
    ],
  },
  {
    nombre: "HeyGen",
    slug: "heygen",
    categoria: "ia",
    descripcion: "Avatares de video con IA, traducción de video y doblaje automático.",
    plans: [
      { nombre: "1 mes", slug: "heygen-1-mes", duracion: "1 mes", precio: 109.9 },
    ],
  },
  {
    nombre: "Synthesia",
    slug: "synthesia",
    categoria: "ia",
    descripcion: "Videos profesionales con presentadores de IA en más de 140 idiomas.",
    plans: [
      { nombre: "1 mes", slug: "synthesia-1-mes", duracion: "1 mes", precio: 109.9 },
    ],
  },
  {
    nombre: "ElevenLabs",
    slug: "elevenlabs",
    categoria: "ia",
    descripcion: "Voces de IA ultra realistas, clonación de voz y doblaje en 30 idiomas.",
    plans: [
      { nombre: "Starter · 1 mes", slug: "elevenlabs-starter-1-mes", duracion: "Starter · 1 mes", precio: 19.9 },
      { nombre: "Creator · 1 mes", slug: "elevenlabs-creator-1-mes", duracion: "Creator · 1 mes", precio: 79.9, precioOriginal: 94.9 },
    ],
  },
  {
    nombre: "Suno",
    slug: "suno",
    categoria: "ia",
    descripcion: "Crea canciones completas con voz y música a partir de una frase.",
    plans: [
      { nombre: "1 mes", slug: "suno-1-mes", duracion: "1 mes", precio: 37.9 },
      { nombre: "12 meses", slug: "suno-12-meses", duracion: "12 meses", precio: 359.9, precioOriginal: 454.8 },
    ],
  },
  {
    nombre: "Udio",
    slug: "udio",
    categoria: "ia",
    descripcion: "Genera música original de alta calidad en cualquier género.",
    plans: [
      { nombre: "1 mes", slug: "udio-1-mes", duracion: "1 mes", precio: 37.9 },
    ],
  },
  {
    nombre: "GitHub Copilot Pro",
    slug: "github-copilot",
    categoria: "ia",
    descripcion: "Tu programador en pareja con IA dentro de VS Code y JetBrains.",
    plans: [
      { nombre: "1 mes", slug: "github-copilot-1-mes", duracion: "1 mes", precio: 37.9 },
      { nombre: "12 meses", slug: "github-copilot-12-meses", duracion: "12 meses", precio: 379.9, precioOriginal: 454.8 },
    ],
  },
  {
    nombre: "Cursor Pro",
    slug: "cursor-pro",
    categoria: "ia",
    descripcion: "El editor de código con IA que entiende todo tu proyecto.",
    plans: [
      { nombre: "1 mes", slug: "cursor-pro-1-mes", duracion: "1 mes", precio: 75.9 },
    ],
  },
  {
    nombre: "Windsurf Pro",
    slug: "windsurf-pro",
    categoria: "ia",
    descripcion: "Editor de código agéntico con IA para programar más rápido.",
    plans: [
      { nombre: "1 mes", slug: "windsurf-pro-1-mes", duracion: "1 mes", precio: 56.9 },
    ],
  },
  {
    nombre: "Notion AI",
    slug: "notion-ai",
    categoria: "ia",
    descripcion: "Escribe, resume y organiza tus notas con IA dentro de Notion.",
    plans: [
      { nombre: "1 mes", slug: "notion-ai-1-mes", duracion: "1 mes", precio: 37.9 },
    ],
  },
  {
    nombre: "Grammarly Premium",
    slug: "grammarly-premium",
    categoria: "ia",
    descripcion: "Corrector con IA para inglés: gramática, tono y reescritura.",
    plans: [
      { nombre: "1 mes", slug: "grammarly-premium-1-mes", duracion: "1 mes", precio: 44.9, precioOriginal: 113.9 },
      { nombre: "12 meses", slug: "grammarly-premium-12-meses", duracion: "12 meses", precio: 229.9 },
    ],
  },
  {
    nombre: "QuillBot Premium",
    slug: "quillbot-premium",
    categoria: "ia",
    descripcion: "Parafraseador, resumidor y corrector con IA para trabajos académicos.",
    plans: [
      { nombre: "1 mes", slug: "quillbot-premium-1-mes", duracion: "1 mes", precio: 29.9, precioOriginal: 37.9 },
      { nombre: "12 meses", slug: "quillbot-premium-12-meses", duracion: "12 meses", precio: 149.9 },
    ],
  },
  {
    nombre: "DeepL Pro",
    slug: "deepl-pro",
    categoria: "ia",
    descripcion: "El traductor con IA más preciso, con traducción de documentos completos.",
    plans: [
      { nombre: "1 mes", slug: "deepl-pro-1-mes", duracion: "1 mes", precio: 34.9 },
      { nombre: "12 meses", slug: "deepl-pro-12-meses", duracion: "12 meses", precio: 329.9 },
    ],
  },
  {
    nombre: "Jasper",
    slug: "jasper-ai",
    categoria: "ia",
    descripcion: "Redacción de marketing con IA que respeta la voz de tu marca.",
    plans: [
      { nombre: "1 mes", slug: "jasper-ai-1-mes", duracion: "1 mes", precio: 149.9 },
    ],
  },
  {
    nombre: "Gamma Pro",
    slug: "gamma-pro",
    categoria: "ia",
    descripcion: "Crea presentaciones, documentos y webs con IA en segundos.",
    plans: [
      { nombre: "1 mes", slug: "gamma-pro-1-mes", duracion: "1 mes", precio: 59.9 },
    ],
  },
  {
    nombre: "Otter.ai Pro",
    slug: "otter-ai",
    categoria: "ia",
    descripcion: "Transcribe y resume tus reuniones automáticamente con IA.",
    plans: [
      { nombre: "1 mes", slug: "otter-ai-1-mes", duracion: "1 mes", precio: 64.9 },
    ],
  },
  {
    nombre: "Canva Pro",
    slug: "canva-pro",
    categoria: "diseno",
    descripcion: "Plantillas premium, kit de marca, quitar fondos y millones de recursos.",
    plans: [
      { nombre: "1 mes", slug: "canva-pro-1-mes", duracion: "1 mes", precio: 10.9 },
      { nombre: "12 meses", slug: "canva-pro-12-meses", duracion: "12 meses", precio: 94.9, precioOriginal: 130.8 },
    ],
  },
  {
    nombre: "Adobe Creative Cloud",
    slug: "adobe-creative-cloud",
    categoria: "diseno",
    descripcion: "Todas las apps de Adobe: Photoshop, Illustrator, Premiere, After Effects y más.",
    plans: [
      { nombre: "1 mes", slug: "adobe-creative-cloud-1-mes", duracion: "1 mes", precio: 89.9, precioOriginal: 229.9 },
      { nombre: "12 meses", slug: "adobe-creative-cloud-12-meses", duracion: "12 meses", precio: 899.9 },
    ],
  },
  {
    nombre: "Adobe Photoshop",
    slug: "adobe-photoshop",
    categoria: "diseno",
    descripcion: "El editor de imágenes estándar de la industria, con relleno generativo con IA.",
    plans: [
      { nombre: "1 mes", slug: "adobe-photoshop-1-mes", duracion: "1 mes", precio: 49.9, precioOriginal: 85.9 },
    ],
  },
  {
    nombre: "Adobe Illustrator",
    slug: "adobe-illustrator",
    categoria: "diseno",
    descripcion: "Diseño vectorial profesional para logos, ilustraciones y tipografía.",
    plans: [
      { nombre: "1 mes", slug: "adobe-illustrator-1-mes", duracion: "1 mes", precio: 49.9, precioOriginal: 85.9 },
    ],
  },
  {
    nombre: "Adobe Premiere Pro",
    slug: "adobe-premiere-pro",
    categoria: "diseno",
    descripcion: "Edición de video profesional para cine, YouTube y redes sociales.",
    plans: [
      { nombre: "1 mes", slug: "adobe-premiere-pro-1-mes", duracion: "1 mes", precio: 49.9, precioOriginal: 85.9 },
    ],
  },
  {
    nombre: "Adobe After Effects",
    slug: "adobe-after-effects",
    categoria: "diseno",
    descripcion: "Animación y efectos visuales de nivel profesional.",
    plans: [
      { nombre: "1 mes", slug: "adobe-after-effects-1-mes", duracion: "1 mes", precio: 49.9, precioOriginal: 85.9 },
    ],
  },
  {
    nombre: "Adobe Lightroom",
    slug: "adobe-lightroom",
    categoria: "diseno",
    descripcion: "Edita y organiza tus fotos desde el celular o la computadora.",
    plans: [
      { nombre: "1 mes", slug: "adobe-lightroom-1-mes", duracion: "1 mes", precio: 29.9, precioOriginal: 45.9 },
    ],
  },
  {
    nombre: "Adobe Express Premium",
    slug: "adobe-express",
    categoria: "diseno",
    descripcion: "Crea contenido para redes rápidamente con plantillas y Firefly.",
    plans: [
      { nombre: "1 mes", slug: "adobe-express-1-mes", duracion: "1 mes", precio: 19.9, precioOriginal: 37.9 },
    ],
  },
  {
    nombre: "Adobe Stock",
    slug: "adobe-stock",
    categoria: "diseno",
    descripcion: "Millones de fotos, videos, vectores y plantillas con licencia.",
    plans: [
      { nombre: "10 descargas · 1 mes", slug: "adobe-stock-10-descargas-1-mes", duracion: "10 descargas · 1 mes", precio: 59.9, precioOriginal: 113.9 },
    ],
  },
  {
    nombre: "Figma Professional",
    slug: "figma-professional",
    categoria: "diseno",
    descripcion: "Diseño de interfaces y prototipos colaborativos en tiempo real.",
    plans: [
      { nombre: "1 mes", slug: "figma-professional-1-mes", duracion: "1 mes", precio: 49.9 },
      { nombre: "12 meses", slug: "figma-professional-12-meses", duracion: "12 meses", precio: 489.9 },
    ],
  },
  {
    nombre: "Framer",
    slug: "framer-pro",
    categoria: "diseno",
    descripcion: "Diseña y publica sitios web sin código, con animaciones y CMS.",
    plans: [
      { nombre: "1 mes", slug: "framer-pro-1-mes", duracion: "1 mes", precio: 59.9 },
    ],
  },
  {
    nombre: "Sketch",
    slug: "sketch",
    categoria: "diseno",
    descripcion: "La herramienta clásica de diseño de interfaces para Mac.",
    plans: [
      { nombre: "1 mes", slug: "sketch-1-mes", duracion: "1 mes", precio: 39.9 },
    ],
  },
  {
    nombre: "Spline",
    slug: "spline-pro",
    categoria: "diseno",
    descripcion: "Diseño 3D interactivo en el navegador para webs y apps.",
    plans: [
      { nombre: "1 mes", slug: "spline-pro-1-mes", duracion: "1 mes", precio: 49.9 },
    ],
  },
  {
    nombre: "Affinity (Designer, Photo, Publisher)",
    slug: "affinity",
    categoria: "diseno",
    descripcion: "Suite creativa profesional sin suscripción: vectores, fotos y maquetación.",
    plans: [
      { nombre: "Licencia de por vida", slug: "affinity-licencia-de-por-vida", duracion: "Licencia de por vida", precio: 299.9, precioOriginal: 449.9 },
    ],
  },
  {
    nombre: "CorelDRAW Graphics Suite",
    slug: "coreldraw",
    categoria: "diseno",
    descripcion: "Diseño gráfico vectorial, maquetación y edición de fotos.",
    plans: [
      { nombre: "12 meses", slug: "coreldraw-12-meses", duracion: "12 meses", precio: 449.9, precioOriginal: 1049.9 },
    ],
  },
  {
    nombre: "Procreate",
    slug: "procreate",
    categoria: "diseno",
    descripcion: "La app de ilustración favorita en iPad, pago único.",
    plans: [
      { nombre: "Licencia de por vida", slug: "procreate-licencia-de-por-vida", duracion: "Licencia de por vida", precio: 54.9 },
    ],
  },
  {
    nombre: "Clip Studio Paint EX",
    slug: "clip-studio-paint",
    categoria: "diseno",
    descripcion: "Ilustración, manga, cómic y animación profesional.",
    plans: [
      { nombre: "12 meses", slug: "clip-studio-paint-12-meses", duracion: "12 meses", precio: 149.9 },
    ],
  },
  {
    nombre: "DaVinci Resolve Studio",
    slug: "davinci-resolve-studio",
    categoria: "diseno",
    descripcion: "Edición, color, efectos y audio profesional en un solo programa.",
    plans: [
      { nombre: "Licencia de por vida", slug: "davinci-resolve-studio-licencia-de-por-vida", duracion: "Licencia de por vida", precio: 649.9, precioOriginal: 1139.9 },
    ],
  },
  {
    nombre: "CapCut Pro",
    slug: "capcut-pro",
    categoria: "diseno",
    descripcion: "Edición de video profesional con efectos, plantillas y exportación sin marca de agua.",
    plans: [
      { nombre: "1 mes", slug: "capcut-pro-1-mes", duracion: "1 mes", precio: 14.9 },
      { nombre: "12 meses", slug: "capcut-pro-12-meses", duracion: "12 meses", precio: 119.9 },
    ],
  },
  {
    nombre: "Picsart Gold",
    slug: "picsart-gold",
    categoria: "diseno",
    descripcion: "Edición de fotos y videos con IA, stickers y plantillas premium.",
    plans: [
      { nombre: "1 mes", slug: "picsart-gold-1-mes", duracion: "1 mes", precio: 14.9 },
      { nombre: "12 meses", slug: "picsart-gold-12-meses", duracion: "12 meses", precio: 99.9 },
    ],
  },
  {
    nombre: "VSCO Plus",
    slug: "vsco-plus",
    categoria: "diseno",
    descripcion: "Filtros de cine y herramientas avanzadas de edición de fotos.",
    plans: [
      { nombre: "12 meses", slug: "vsco-plus-12-meses", duracion: "12 meses", precio: 79.9 },
    ],
  },
  {
    nombre: "Remini Pro",
    slug: "remini-pro",
    categoria: "diseno",
    descripcion: "Mejora fotos borrosas y antiguas con IA en un toque.",
    plans: [
      { nombre: "1 mes", slug: "remini-pro-1-mes", duracion: "1 mes", precio: 19.9 },
    ],
  },
  {
    nombre: "Freepik Premium",
    slug: "freepik-premium",
    categoria: "diseno",
    descripcion: "Millones de vectores, fotos, PSD e íconos, más generador de imágenes con IA.",
    plans: [
      { nombre: "1 mes", slug: "freepik-premium-1-mes", duracion: "1 mes", precio: 29.9, precioOriginal: 45.9 },
      { nombre: "12 meses", slug: "freepik-premium-12-meses", duracion: "12 meses", precio: 249.9 },
    ],
  },
  {
    nombre: "Envato Elements",
    slug: "envato-elements",
    categoria: "diseno",
    descripcion: "Descargas ilimitadas de plantillas, fuentes, música y videos.",
    plans: [
      { nombre: "1 mes", slug: "envato-elements-1-mes", duracion: "1 mes", precio: 29.9, precioOriginal: 62.9 },
      { nombre: "12 meses", slug: "envato-elements-12-meses", duracion: "12 meses", precio: 299.9 },
    ],
  },
  {
    nombre: "Shutterstock",
    slug: "shutterstock",
    categoria: "diseno",
    descripcion: "Imágenes y videos de stock de alta calidad con licencia comercial.",
    plans: [
      { nombre: "10 imágenes · 1 mes", slug: "shutterstock-10-imagenes-1-mes", duracion: "10 imágenes · 1 mes", precio: 109.9 },
    ],
  },
  {
    nombre: "Motion Array",
    slug: "motion-array",
    categoria: "diseno",
    descripcion: "Plantillas de video, presets, música y efectos de sonido ilimitados.",
    plans: [
      { nombre: "1 mes", slug: "motion-array-1-mes", duracion: "1 mes", precio: 39.9 },
    ],
  },
  {
    nombre: "Artlist",
    slug: "artlist",
    categoria: "diseno",
    descripcion: "Música y efectos de sonido sin derechos para tus videos.",
    plans: [
      { nombre: "12 meses", slug: "artlist-12-meses", duracion: "12 meses", precio: 449.9 },
    ],
  },
  {
    nombre: "Epidemic Sound",
    slug: "epidemic-sound",
    categoria: "diseno",
    descripcion: "Música para creadores de contenido sin reclamos de copyright.",
    plans: [
      { nombre: "1 mes", slug: "epidemic-sound-1-mes", duracion: "1 mes", precio: 39.9 },
    ],
  },
  {
    nombre: "Storyblocks",
    slug: "storyblocks",
    categoria: "diseno",
    descripcion: "Video, audio e imágenes de stock ilimitados.",
    plans: [
      { nombre: "1 mes", slug: "storyblocks-1-mes", duracion: "1 mes", precio: 49.9 },
    ],
  },
  {
    nombre: "Placeit",
    slug: "placeit",
    categoria: "diseno",
    descripcion: "Mockups, logos y videos promocionales en minutos.",
    plans: [
      { nombre: "1 mes", slug: "placeit-1-mes", duracion: "1 mes", precio: 39.9 },
    ],
  },
  {
    nombre: "Creative Market",
    slug: "creative-market",
    categoria: "diseno",
    descripcion: "Fuentes, plantillas y gráficos de diseñadores independientes.",
    plans: [
      { nombre: "Créditos S/ 50", slug: "creative-market-creditos-s-50", duracion: "Créditos S/ 50", precio: 54.9 },
    ],
  },
  {
    nombre: "Pixlr Premium",
    slug: "pixlr-premium",
    categoria: "diseno",
    descripcion: "Editor de fotos online con herramientas de IA.",
    plans: [
      { nombre: "1 mes", slug: "pixlr-premium-1-mes", duracion: "1 mes", precio: 14.9 },
    ],
  },
  {
    nombre: "Microsoft 365",
    slug: "microsoft-365",
    categoria: "productividad",
    descripcion: "Word, Excel, PowerPoint y 1 TB en OneDrive para tu cuenta personal.",
    plans: [
      { nombre: "12 meses", slug: "microsoft-365-12-meses", duracion: "12 meses", precio: 75.9, precioOriginal: 113.9 },
    ],
  },
  {
    nombre: "Google One 2 TB",
    slug: "google-one",
    categoria: "productividad",
    descripcion: "Almacenamiento compartido para Gmail, Drive y Fotos.",
    plans: [
      { nombre: "1 mes", slug: "google-one-1-mes", duracion: "1 mes", precio: 15.9 },
      { nombre: "12 meses", slug: "google-one-12-meses", duracion: "12 meses", precio: 149.9 },
    ],
  },
  {
    nombre: "Duolingo Super",
    slug: "duolingo-max",
    categoria: "productividad",
    descripcion: "Aprende idiomas sin anuncios, con vidas ilimitadas y práctica personalizada.",
    plans: [
      { nombre: "12 meses", slug: "duolingo-max-12-meses", duracion: "12 meses", precio: 59.9 },
    ],
  },
  {
    nombre: "Notion Plus",
    slug: "notion-plus",
    categoria: "productividad",
    descripcion: "Espacio de trabajo para notas, tareas y wikis sin límites.",
    plans: [
      { nombre: "1 mes", slug: "notion-plus-1-mes", duracion: "1 mes", precio: 37.9 },
    ],
  },
  {
    nombre: "Todoist Pro",
    slug: "todoist-pro",
    categoria: "productividad",
    descripcion: "Organiza tus tareas y proyectos con recordatorios y filtros.",
    plans: [
      { nombre: "12 meses", slug: "todoist-pro-12-meses", duracion: "12 meses", precio: 149.9 },
    ],
  },
  {
    nombre: "LinkedIn Premium Career",
    slug: "linkedin-premium",
    categoria: "productividad",
    descripcion: "Destaca en búsquedas de empleo y accede a LinkedIn Learning.",
    plans: [
      { nombre: "1 mes", slug: "linkedin-premium-1-mes", duracion: "1 mes", precio: 59.9, precioOriginal: 113.9 },
    ],
  },
  {
    nombre: "Xbox Game Pass Ultimate",
    slug: "game-pass",
    categoria: "gaming",
    descripcion: "Cientos de juegos en consola, PC y la nube, más EA Play incluido.",
    plans: [
      { nombre: "1 mes", slug: "game-pass-1-mes", duracion: "1 mes", precio: 37.9, precioOriginal: 56.9 },
      { nombre: "3 meses", slug: "game-pass-3-meses", duracion: "3 meses", precio: 105.9 },
    ],
  },
  {
    nombre: "PlayStation Plus Extra",
    slug: "playstation-plus",
    categoria: "gaming",
    descripcion: "Catálogo de juegos de PS4 y PS5, multijugador en línea y descuentos exclusivos.",
    plans: [
      { nombre: "1 mes", slug: "playstation-plus-1-mes", duracion: "1 mes", precio: 35.9 },
      { nombre: "12 meses", slug: "playstation-plus-12-meses", duracion: "12 meses", precio: 337.9, precioOriginal: 474.9 },
    ],
  },
  {
    nombre: "Nintendo Switch Online",
    slug: "nintendo-switch-online",
    categoria: "gaming",
    descripcion: "Juego en línea, clásicos de NES y SNES y guardado en la nube.",
    plans: [
      { nombre: "12 meses", slug: "nintendo-switch-online-12-meses", duracion: "12 meses", precio: 79.9 },
    ],
  },
  {
    nombre: "Discord Nitro",
    slug: "discord-nitro",
    categoria: "gaming",
    descripcion: "Emojis personalizados, mejoras de servidor y transmisión en HD.",
    plans: [
      { nombre: "1 mes", slug: "discord-nitro-1-mes", duracion: "1 mes", precio: 29.9, precioOriginal: 37.9 },
      { nombre: "12 meses", slug: "discord-nitro-12-meses", duracion: "12 meses", precio: 299.9 },
    ],
  },
  {
    nombre: "Tarjeta Steam",
    slug: "steam-wallet",
    categoria: "gaming",
    descripcion: "Saldo para comprar juegos y contenido en Steam.",
    plans: [
      { nombre: "S/ 50", slug: "steam-wallet-s-50", duracion: "S/ 50", precio: 54.9 },
      { nombre: "S/ 100", slug: "steam-wallet-s-100", duracion: "S/ 100", precio: 104.9 },
    ],
  },
  {
    nombre: "NordVPN",
    slug: "nordvpn",
    categoria: "seguridad",
    descripcion: "VPN rápida y segura para hasta 10 dispositivos, con bloqueo de anuncios y malware.",
    plans: [
      { nombre: "1 mes", slug: "nordvpn-1-mes", duracion: "1 mes", precio: 14.9 },
      { nombre: "12 meses", slug: "nordvpn-12-meses", duracion: "12 meses", precio: 113.9, precioOriginal: 177.9 },
    ],
  },
  {
    nombre: "ExpressVPN",
    slug: "expressvpn",
    categoria: "seguridad",
    descripcion: "VPN premium con servidores en 105 países y velocidad máxima.",
    plans: [
      { nombre: "1 mes", slug: "expressvpn-1-mes", duracion: "1 mes", precio: 24.9 },
      { nombre: "12 meses", slug: "expressvpn-12-meses", duracion: "12 meses", precio: 199.9 },
    ],
  },
  {
    nombre: "Surfshark",
    slug: "surfshark",
    categoria: "seguridad",
    descripcion: "VPN para dispositivos ilimitados con antivirus incluido.",
    plans: [
      { nombre: "12 meses", slug: "surfshark-12-meses", duracion: "12 meses", precio: 89.9 },
    ],
  },
  {
    nombre: "Kaspersky Premium",
    slug: "kaspersky-premium",
    categoria: "seguridad",
    descripcion: "Antivirus, protección de pagos y gestor de contraseñas.",
    plans: [
      { nombre: "12 meses", slug: "kaspersky-premium-12-meses", duracion: "12 meses", precio: 99.9, precioOriginal: 149.9 },
    ],
  },
  {
    nombre: "Bitdefender Total Security",
    slug: "bitdefender-total",
    categoria: "seguridad",
    descripcion: "Protección completa para Windows, Mac, Android e iOS.",
    plans: [
      { nombre: "12 meses", slug: "bitdefender-total-12-meses", duracion: "12 meses", precio: 89.9 },
    ],
  },
];
