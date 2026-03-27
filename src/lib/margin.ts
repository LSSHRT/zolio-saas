/**
 * Calcule la marge d'un devis
 *
 * Marge = (Prix de vente - Coût) / Prix de vente × 100
 */

type LigneForMargin = {
  quantite: number;
  prixUnitaire: number;
  cout?: number;
  isOptional?: boolean;
};

export function calculateMargin(lignes: LigneForMargin[]): {
  totalRevenue: number;
  totalCost: number;
  margin: number; // Pourcentage
  profit: number; // Montant en €
} {
  const activeLines = lignes.filter((l) => !l.isOptional);

  const totalRevenue = activeLines.reduce(
    (sum, l) => sum + l.quantite * l.prixUnitaire,
    0
  );

  const totalCost = activeLines.reduce(
    (sum, l) => sum + l.quantite * (l.cout || 0),
    0
  );

  const profit = totalRevenue - totalCost;
  const margin = totalRevenue > 0 ? Math.round((profit / totalRevenue) * 100) : 0;

  return { totalRevenue, totalCost, margin, profit };
}
