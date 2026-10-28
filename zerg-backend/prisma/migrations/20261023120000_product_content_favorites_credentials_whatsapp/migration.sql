-- AlterTable
ALTER TABLE "conversations" ADD COLUMN     "ultimoEntranteEn" TIMESTAMP(3),
ADD COLUMN     "waId" TEXT;

-- AlterTable
ALTER TABLE "messages" ADD COLUMN     "waMessageId" TEXT;

-- AlterTable
ALTER TABLE "products" ADD COLUMN     "faqs" JSONB,
ADD COLUMN     "incluye" JSONB,
ADD COLUMN     "pasos" JSONB;

-- CreateTable
CREATE TABLE "favorites" (
    "userId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "favorites_pkey" PRIMARY KEY ("userId","productId")
);

-- CreateTable
CREATE TABLE "credentials" (
    "id" TEXT NOT NULL,
    "orderItemId" TEXT NOT NULL,
    "datos" TEXT NOT NULL,
    "venceEn" TIMESTAMP(3),
    "publicadoEn" TIMESTAMP(3),
    "enviadoCorreoEn" TIMESTAMP(3),
    "enviadoWhatsappEn" TIMESTAMP(3),
    "vistoEn" TIMESTAMP(3),
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "credentials_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "credentials_orderItemId_key" ON "credentials"("orderItemId");

-- CreateIndex
CREATE UNIQUE INDEX "conversations_waId_key" ON "conversations"("waId");

-- CreateIndex
CREATE UNIQUE INDEX "messages_waMessageId_key" ON "messages"("waMessageId");

-- AddForeignKey
ALTER TABLE "favorites" ADD CONSTRAINT "favorites_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "favorites" ADD CONSTRAINT "favorites_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "credentials" ADD CONSTRAINT "credentials_orderItemId_fkey" FOREIGN KEY ("orderItemId") REFERENCES "order_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

