-- CreateEnum
CREATE TYPE "AudienciaNotificacion" AS ENUM ('ADMIN', 'CLIENTE');

-- CreateEnum
CREATE TYPE "TipoNotificacion" AS ENUM ('COMPRA', 'VENTA', 'PEDIDO', 'RESENA');

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "audiencia" "AudienciaNotificacion" NOT NULL,
    "tipo" "TipoNotificacion" NOT NULL,
    "titulo" TEXT NOT NULL,
    "mensaje" TEXT NOT NULL,
    "href" TEXT,
    "leida" BOOLEAN NOT NULL DEFAULT false,
    "userId" TEXT,
    "orderId" TEXT,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "notifications_audiencia_userId_creadoEn_idx" ON "notifications"("audiencia", "userId", "creadoEn");

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;
