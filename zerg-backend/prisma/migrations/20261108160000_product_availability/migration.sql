-- AlterTable
ALTER TABLE "products" ADD COLUMN     "disponible" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "mensajeAgotado" TEXT,
ADD COLUMN     "stock" INTEGER;

