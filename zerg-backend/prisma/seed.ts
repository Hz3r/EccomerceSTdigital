import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import bcrypt from "bcrypt";
import dotenv from "dotenv";

dotenv.config();

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL!,
});

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  // ==================== ADMIN ====================
  const adminEmail = "admin@zerg.com";
  const adminPassword = "admin123";

  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  let admin;
  if (existingAdmin) {
    console.log("El admin ya existe:", adminEmail);
    admin = existingAdmin;
  } else {
    const passwordHash = await bcrypt.hash(adminPassword, 10);
    admin = await prisma.user.create({
      data: {
        nombre: "Administrador",
        email: adminEmail,
        passwordHash,
        rol: "ADMIN",
      },
    });
    console.log("Admin creado:", admin.email);
  }

  // ==================== CATEGORÍA: STREAMING ====================
  const categoryStreaming = await prisma.category.upsert({
    where: { slug: "streaming" },
    update: {},
    create: {
      nombre: "Streaming",
      slug: "streaming",
      descripcion: "Servicios de streaming de video y música",
    },
  });

  console.log("Categoría creada:", categoryStreaming.nombre);

  // ==================== PRODUCTOS ====================
  const products = [
    {
      nombre: "Netflix",
      slug: "netflix",
      descripcion: "Plataforma de streaming con películas, series y documentales",
      plans: [
        {
          nombre: "Básico con anuncios",
          slug: "netflix-basico-anuncios",
          duracion: "1 mes",
          precio: 49.0,
          descripcion: "720p, 1 dispositivo, con anuncios",
        },
        {
          nombre: "Estándar",
          slug: "netflix-estandar",
          duracion: "1 mes",
          precio: 89.0,
          precioOriginal: 109.0,
          descripcion: "1080p, 2 dispositivos simultáneos",
        },
        {
          nombre: "Premium",
          slug: "netflix-premium",
          duracion: "1 mes",
          precio: 139.0,
          precioOriginal: 169.0,
          descripcion: "4K HDR, 4 dispositivos simultáneos",
        },
      ],
    },
    {
      nombre: "Disney+",
      slug: "disney-plus",
      descripcion: "Streaming de Disney, Pixar, Marvel, Star Wars y National Geographic",
      plans: [
        {
          nombre: "Básico con anuncios",
          slug: "disney-basico-anuncios",
          duracion: "1 mes",
          precio: 59.0,
          descripcion: "1080p, 2 dispositivos, con anuncios",
        },
        {
          nombre: "Premium",
          slug: "disney-premium",
          duracion: "1 mes",
          precio: 99.0,
          precioOriginal: 119.0,
          descripcion: "4K HDR, 4 dispositivos, sin anuncios",
        },
      ],
    },
    {
      nombre: "HBO Max",
      slug: "hbo-max",
      descripcion: "Series, películas y contenido exclusivo de HBO",
      plans: [
        {
          nombre: "Con anuncios",
          slug: "hbo-con-anuncios",
          duracion: "1 mes",
          precio: 59.0,
          descripcion: "1080p, 2 dispositivos, con anuncios",
        },
        {
          nombre: "Sin anuncios",
          slug: "hbo-sin-anuncios",
          duracion: "1 mes",
          precio: 99.0,
          precioOriginal: 119.0,
          descripcion: "4K, 3 dispositivos, sin anuncios",
        },
      ],
    },
    {
      nombre: "Spotify",
      slug: "spotify",
      descripcion: "Servicio de streaming de música y podcasts",
      plans: [
        {
          nombre: "Individual",
          slug: "spotify-individual",
          duracion: "1 mes",
          precio: 59.0,
          descripcion: "1 cuenta, sin anuncios, descargas offline",
        },
        {
          nombre: "Duo",
          slug: "spotify-duo",
          duracion: "1 mes",
          precio: 79.0,
          descripcion: "2 cuentas Premium para parejas",
        },
        {
          nombre: "Familiar",
          slug: "spotify-familiar",
          duracion: "1 mes",
          precio: 99.0,
          descripcion: "Hasta 6 cuentas Premium",
        },
      ],
    },
    {
      nombre: "ChatGPT Plus",
      slug: "chatgpt-plus",
      descripcion: "Acceso a ChatGPT con inteligencia artificial avanzada",
      plans: [
        {
          nombre: "Plus",
          slug: "chatgpt-plus",
          duracion: "1 mes",
          precio: 650.0,
          descripcion: "GPT-4o, generación de imágenes, análisis avanzado",
        },
        {
          nombre: "Pro",
          slug: "chatgpt-pro",
          duracion: "1 mes",
          precio: 2700.0,
          descripcion: "Acceso ilimitado a todos los modelos, modo Phi",
        },
      ],
    },
  ];

  for (const productData of products) {
    const { plans, ...productInfo } = productData;

    const product = await prisma.product.upsert({
      where: { slug: productInfo.slug },
      update: {},
      create: {
        ...productInfo,
        categoryId: categoryStreaming.id,
      },
    });

    console.log("Producto creado:", product.nombre);

    for (const planData of plans) {
      const plan = await prisma.plan.upsert({
        where: { slug: planData.slug },
        update: {},
        create: {
          ...planData,
          productId: product.id,
        },
      });
      console.log(`  Plan: ${plan.nombre} - $${plan.precio}`);
    }
  }

  console.log("\nSeed completado exitosamente!");
}

main()
  .catch((e) => {
    console.error("Error al ejecutar seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
