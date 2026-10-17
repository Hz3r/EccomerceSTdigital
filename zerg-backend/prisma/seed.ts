import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import bcrypt from "bcrypt";
import dotenv from "dotenv";
import { seedCategories, seedProducts, seedReviews } from "./catalog.js";

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

  // ==================== CATEGORÍAS ====================
  const categoryIds = new Map<string, string>();
  for (const cat of seedCategories) {
    const category = await prisma.category.upsert({
      where: { slug: cat.slug },
      update: { nombre: cat.nombre, descripcion: cat.descripcion, isActive: true },
      create: cat,
    });
    categoryIds.set(cat.slug, category.id);
  }
  console.log(`Categorías: ${categoryIds.size}`);

  // ==================== PRODUCTOS Y PLANES ====================
  // El catálogo vive en prisma/catalog.ts. Volver a ejecutar el seed actualiza precios y descripciones.
  for (const { plans, categoria, ...productInfo } of seedProducts) {
    const categoryId = categoryIds.get(categoria);
    if (!categoryId) throw new Error(`Categoría desconocida: ${categoria}`);

    const product = await prisma.product.upsert({
      where: { slug: productInfo.slug },
      update: { ...productInfo, categoryId, isActivo: true },
      create: { ...productInfo, categoryId },
    });

    for (const planData of plans) {
      await prisma.plan.upsert({
        where: { slug: planData.slug },
        update: { ...planData, precioOriginal: planData.precioOriginal ?? null, isActivo: true, productId: product.id },
        create: { ...planData, productId: product.id },
      });
    }

    // Desactiva planes antiguos del producto que ya no están en el catálogo
    await prisma.plan.updateMany({
      where: { productId: product.id, slug: { notIn: plans.map((p) => p.slug) } },
      data: { isActivo: false },
    });

    console.log(`Producto: ${product.nombre} (${plans.length} planes)`);
  }

  // Productos del seed anterior reemplazados por el nuevo catálogo
  await prisma.product.updateMany({
    where: { slug: { in: ["netflix", "hbo-max", "spotify"] } },
    data: { isActivo: false },
  });

  console.log(`\nProductos: ${seedProducts.length}`);

  // ==================== OPINIONES DE EJEMPLO ====================
  // Clientes ficticios de desarrollo con reseñas aprobadas para la portada.
  const clientPasswordHash = await bcrypt.hash("cliente123", 10);
  for (const r of seedReviews) {
    const user = await prisma.user.upsert({
      where: { email: r.email },
      update: {},
      create: { nombre: r.nombre, email: r.email, passwordHash: clientPasswordHash, rol: "CLIENTE" },
    });
    const product = await prisma.product.findUniqueOrThrow({ where: { slug: r.producto } });
    const fecha = new Date(`${r.fecha}T15:00:00.000Z`);
    await prisma.review.upsert({
      where: { productId_userId: { productId: product.id, userId: user.id } },
      update: { puntuacion: r.puntuacion, comentario: r.comentario, isApproved: true },
      create: {
        puntuacion: r.puntuacion,
        comentario: r.comentario,
        isApproved: true,
        productId: product.id,
        userId: user.id,
        creadoEn: fecha,
      },
    });
  }
  console.log(`Opiniones: ${seedReviews.length}`);
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
