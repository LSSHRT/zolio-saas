-- CreateTable: DevisTemplate
CREATE TABLE "DevisTemplate" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "description" TEXT,
    "tva" DOUBLE PRECISION NOT NULL DEFAULT 20,
    "remise" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DevisTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable: LigneTemplate
CREATE TABLE "LigneTemplate" (
    "id" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "nomPrestation" TEXT NOT NULL,
    "unite" TEXT NOT NULL DEFAULT 'U',
    "quantite" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "prixUnitaire" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "tva" TEXT NOT NULL DEFAULT '20',
    "isOptional" BOOLEAN NOT NULL DEFAULT false,
    "position" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LigneTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable: FactureRecurrente
CREATE TABLE "FactureRecurrente" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "montantHT" DOUBLE PRECISION NOT NULL,
    "tva" DOUBLE PRECISION NOT NULL DEFAULT 20,
    "montantTTC" DOUBLE PRECISION NOT NULL,
    "frequence" TEXT NOT NULL,
    "jourMois" INTEGER NOT NULL DEFAULT 1,
    "prochaineDate" TIMESTAMP(3) NOT NULL,
    "dateFin" TIMESTAMP(3),
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FactureRecurrente_pkey" PRIMARY KEY ("id")
);

-- AlterTable: Facture
ALTER TABLE "Facture" ADD COLUMN "recurrenteId" TEXT;

-- CreateIndex
CREATE INDEX "DevisTemplate_userId_idx" ON "DevisTemplate"("userId");

-- CreateIndex
CREATE INDEX "LigneTemplate_templateId_idx" ON "LigneTemplate"("templateId");

-- CreateIndex
CREATE INDEX "FactureRecurrente_userId_idx" ON "FactureRecurrente"("userId");

-- CreateIndex
CREATE INDEX "FactureRecurrente_prochaineDate_idx" ON "FactureRecurrente"("prochaineDate");

-- CreateIndex
CREATE INDEX "FactureRecurrente_actif_idx" ON "FactureRecurrente"("actif");

-- CreateIndex
CREATE INDEX "Facture_recurrenteId_idx" ON "Facture"("recurrenteId");

-- AddForeignKey
ALTER TABLE "LigneTemplate" ADD CONSTRAINT "LigneTemplate_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "DevisTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FactureRecurrente" ADD CONSTRAINT "FactureRecurrente_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Facture" ADD CONSTRAINT "Facture_recurrenteId_fkey" FOREIGN KEY ("recurrenteId") REFERENCES "FactureRecurrente"("id") ON DELETE SET NULL ON UPDATE CASCADE;
