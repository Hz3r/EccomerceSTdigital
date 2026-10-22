-- CreateEnum
CREATE TYPE "MetodoPago" AS ENUM ('DIRECTO', 'IZIPAY', 'BINANCE_PAY');

-- CreateEnum
CREATE TYPE "EstadoPago" AS ENUM ('PENDIENTE', 'EN_REVISION', 'PAGADO', 'RECHAZADO');

-- CreateEnum
CREATE TYPE "EstadoConversacion" AS ENUM ('ABIERTA', 'CERRADA');

-- CreateEnum
CREATE TYPE "CanalConversacion" AS ENUM ('WEB', 'WHATSAPP');

-- CreateEnum
CREATE TYPE "AutorMensaje" AS ENUM ('CLIENTE', 'ADMIN');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "TipoNotificacion" ADD VALUE 'PAGO';
ALTER TYPE "TipoNotificacion" ADD VALUE 'MENSAJE';

-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "metodoPago" "MetodoPago";

-- CreateTable
CREATE TABLE "payments" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "metodo" "MetodoPago" NOT NULL,
    "estado" "EstadoPago" NOT NULL DEFAULT 'PENDIENTE',
    "monto" DECIMAL(10,2) NOT NULL,
    "moneda" TEXT NOT NULL DEFAULT 'PEN',
    "referencia" TEXT,
    "comprobante" TEXT,
    "motivoRechazo" TEXT,
    "detalle" JSONB,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "conversations" (
    "id" TEXT NOT NULL,
    "tema" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "email" TEXT,
    "telefono" TEXT,
    "canal" "CanalConversacion" NOT NULL DEFAULT 'WEB',
    "estado" "EstadoConversacion" NOT NULL DEFAULT 'ABIERTA',
    "userId" TEXT,
    "tokenHash" TEXT NOT NULL,
    "noLeidasAdmin" INTEGER NOT NULL DEFAULT 0,
    "noLeidasCliente" INTEGER NOT NULL DEFAULT 0,
    "ultimoMensajeEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "conversations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "messages" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "autor" "AutorMensaje" NOT NULL,
    "texto" TEXT NOT NULL,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "payments_orderId_idx" ON "payments"("orderId");

-- CreateIndex
CREATE UNIQUE INDEX "conversations_tokenHash_key" ON "conversations"("tokenHash");

-- CreateIndex
CREATE INDEX "conversations_estado_ultimoMensajeEn_idx" ON "conversations"("estado", "ultimoMensajeEn");

-- CreateIndex
CREATE INDEX "messages_conversationId_creadoEn_idx" ON "messages"("conversationId", "creadoEn");

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
