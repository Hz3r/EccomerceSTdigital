-- CreateEnum
CREATE TYPE "TipoPagina" AS ENUM ('PAGINA', 'GUIA');

-- CreateTable
CREATE TABLE "pages" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "tipo" "TipoPagina" NOT NULL DEFAULT 'GUIA',
    "titulo" TEXT NOT NULL,
    "resumen" TEXT,
    "portadaUrl" TEXT,
    "bloques" JSONB NOT NULL,
    "publicado" BOOLEAN NOT NULL DEFAULT true,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "pages_slug_key" ON "pages"("slug");

-- CreateIndex
CREATE INDEX "pages_tipo_publicado_orden_idx" ON "pages"("tipo", "publicado", "orden");

