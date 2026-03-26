import { describe, it, expect } from "vitest";
import {
  parseLignes,
  getLineTotal,
  computeTotals,
  normalizeLigneForOutput,
  type LignePayload,
} from "../devis-lignes";

describe("devis-lignes (intégration)", () => {
  describe("scénario devis complet", () => {
    it("should calculate a full devis with multiple lines and discount", () => {
      // Simule un devis peinture complet
      const lignes: LignePayload[] = [
        { nomPrestation: "Protection sols", quantite: 1, prixUnitaire: 150, unite: "forfait", tva: "20" },
        { nomPrestation: "Peinture murs 2 couches", quantite: 40, prixUnitaire: 24, unite: "m²", tva: "20" },
        { nomPrestation: "Peinture plafond", quantite: 15, prixUnitaire: 20, unite: "m²", tva: "20" },
        { nomPrestation: "Déplacement", quantite: 1, prixUnitaire: 45, unite: "forfait", tva: "20" },
      ];

      const { totalHT, totalTTC } = computeTotals(lignes, 20, 0);

      // 150 + 960 + 300 + 45 = 1455 HT
      expect(totalHT).toBe(1455);
      // 1455 * 1.20 = 1746 TTC
      expect(totalTTC).toBe(1746);
    });

    it("should apply 10% discount correctly", () => {
      const lignes: LignePayload[] = [
        { nomPrestation: "Peinture murs", quantite: 40, prixUnitaire: 24, unite: "m²", tva: "20" },
      ];

      const { totalHT, totalTTC } = computeTotals(lignes, 20, 10);

      // 960 * 0.90 = 864 HT
      expect(totalHT).toBe(864);
      // 864 * 1.20 = 1036.8 TTC
      expect(totalTTC).toBeCloseTo(1036.8, 1);
    });

    it("should handle optional lines (not included in totals)", () => {
      const lignes: LignePayload[] = [
        { nomPrestation: "Peinture murs", quantite: 40, prixUnitaire: 24, unite: "m²", tva: "20" },
        { nomPrestation: "Peinture boiseries", quantite: 18, prixUnitaire: 18, unite: "ml", tva: "20", isOptional: true },
      ];

      const { totalHT } = computeTotals(lignes, 20, 0);

      // Seule la première ligne compte (pas l'option)
      expect(totalHT).toBe(960);
    });

    it("should handle multi-TVA rates", () => {
      const lignes: LignePayload[] = [
        { nomPrestation: "Prestation principale", quantite: 1, prixUnitaire: 1000, tva: "10" },
        { nomPrestation: "Matériel", quantite: 1, prixUnitaire: 500, tva: "20" },
      ];

      const { totalTTC } = computeTotals(lignes, 20, 0);

      // (1000 * 1.10) + (500 * 1.20) = 1100 + 600 = 1700
      expect(totalTTC).toBe(1700);
    });
  });

  describe("normalisation pour PDF", () => {
    it("should normalize all fields for PDF output", () => {
      const input: LignePayload = {
        nomPrestation: "  Peinture murs  ",
        quantite: "20",
        prixUnitaire: "24",
        tva: "20",
        unite: "  m²  ",
      };

      const output = normalizeLigneForOutput(input);

      expect(output.nomPrestation).toBe("Peinture murs");
      expect(output.quantite).toBe(20);
      expect(output.prixUnitaire).toBe(24);
      expect(output.totalLigne).toBe(480);
      expect(output.tva).toBe("20");
      expect(output.unite).toBe("m²");
      expect(output.isOptional).toBe(false);
    });
  });

  describe("parseLignes (JSON)", () => {
    it("should parse a full devis JSON string", () => {
      const json = JSON.stringify([
        { nomPrestation: "Peinture", quantite: 20, prixUnitaire: 24, tva: "20", unite: "m²" },
        { nomPrestation: "Préparation", quantite: 20, prixUnitaire: 14, tva: "20", unite: "m²" },
      ]);

      const result = parseLignes(json);
      expect(result).toHaveLength(2);
      expect(result[0].nomPrestation).toBe("Peinture");
      expect(result[1].prixUnitaire).toBe(14);
    });
  });
});
