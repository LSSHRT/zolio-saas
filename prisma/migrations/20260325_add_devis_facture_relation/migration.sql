-- AlterTable: Add devisId column to Facture
ALTER TABLE "Facture" ADD COLUMN "devisId" TEXT;

-- CreateIndex
CREATE INDEX "Facture_devisId_idx" ON "Facture"("devisId");

-- AddForeignKey
ALTER TABLE "Facture" ADD CONSTRAINT "Facture_devisId_fkey" FOREIGN KEY ("devisId") REFERENCES "Devis"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Migrate existing data: link devisRef (numero) to devisId (id)
UPDATE "Facture" f
SET "devisId" = d.id
FROM "Devis" d
WHERE f."devisRef" = d.numero AND f."userId" = d."userId" AND f."devisId" IS NULL;
