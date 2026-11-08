-- CreateTable
CREATE TABLE "newsletter_campaigns" (
    "id" TEXT NOT NULL,
    "asunto" TEXT NOT NULL,
    "mensaje" TEXT NOT NULL,
    "botonTexto" TEXT,
    "botonUrl" TEXT,
    "estado" TEXT NOT NULL DEFAULT 'ENVIANDO',
    "total" INTEGER NOT NULL DEFAULT 0,
    "enviados" INTEGER NOT NULL DEFAULT 0,
    "fallidos" INTEGER NOT NULL DEFAULT 0,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "terminadoEn" TIMESTAMP(3),

    CONSTRAINT "newsletter_campaigns_pkey" PRIMARY KEY ("id")
);

