import { prisma } from "@/lib/prisma";
import { computeTotals } from "@/lib/devis-lignes";
import { parseNumber } from "@/lib/devis-lignes";

export async function syncDevisTotals(devisId: string) {
  const devis = await prisma.devis.findUnique({
    where: { id: devisId },
    include: { lignesNorm: true },
  });

  if (!devis) return;

  const remiseGlobale = parseNumber(devis.remise, 0);
  const tvaGlobale = parseNumber(devis.tva, 20);
  
  const lignes = devis.lignesNorm.map(l => ({
    isOptional: l.isOptional,
    nomPrestation: l.nomPrestation,
    prixUnitaire: parseNumber(l.prixUnitaire),
    quantite: parseNumber(l.quantite),
    totalLigne: parseNumber(l.totalLigne),
    tva: l.tva,
    unite: l.unite,
  }));

  const { totalHT, totalTTC } = computeTotals(lignes, tvaGlobale, remiseGlobale);

  await prisma.devis.update({
    where: { id: devisId },
    data: {
      totalHT,
      totalTTC,
    },
  });
}
