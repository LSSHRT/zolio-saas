import { describe, it, expect } from "vitest";
import {
  parseLignes,
  getLineTotal,
  parseNumber,
  normalizeLigneForOutput,
  computeTotals,
  type LignePayload,
} from "../devis-lignes";

describe("devis-lignes", () => {
  describe("parseLignes", () => {
    it("should parse JSON string", () => {
      const json = '[{"nomPrestation":"Test","quantite":2,"prixUnitaire":10}]';
      const result = parseLignes(json);
      expect(result).toHaveLength(1);
      expect(result[0].nomPrestation).toBe("Test");
    });

    it("should parse array directly", () => {
      const arr = [{ nomPrestation: "Test", quantite: 1 }];
      const result = parseLignes(arr);
      expect(result).toHaveLength(1);
    });

    it("should return empty for invalid input", () => {
      expect(parseLignes(null)).toEqual([]);
      expect(parseLignes(undefined)).toEqual([]);
      expect(parseLignes("invalid-json")).toEqual([]);
      expect(parseLignes(123)).toEqual([]);
    });
  });

  describe("getLineTotal", () => {
    it("should use totalLigne if provided", () => {
      const line: LignePayload = { totalLigne: 500, quantite: 2, prixUnitaire: 100 };
      expect(getLineTotal(line)).toBe(500);
    });

    it("should calculate from quantite * prixUnitaire if no totalLigne", () => {
      const line: LignePayload = { quantite: 3, prixUnitaire: 50 };
      expect(getLineTotal(line)).toBe(150);
    });

    it("should handle string values", () => {
      const line: LignePayload = { quantite: "2", prixUnitaire: "25" };
      expect(getLineTotal(line)).toBe(50);
    });

    it("should return 0 for missing values", () => {
      expect(getLineTotal({})).toBe(0);
    });
  });

  describe("parseNumber", () => {
    it("should parse valid numbers", () => {
      expect(parseNumber(42)).toBe(42);
      expect(parseNumber("3.14")).toBe(3.14);
      expect(parseNumber("10")).toBe(10);
    });

    it("should return fallback for invalid values", () => {
      expect(parseNumber("abc")).toBe(0);
      expect(parseNumber(null)).toBe(0);
      expect(parseNumber(undefined, 5)).toBe(5);
    });
  });

  describe("normalizeLigneForOutput", () => {
    it("should normalize a line", () => {
      const input: LignePayload = {
        nomPrestation: "Peinture murs",
        quantite: "20",
        prixUnitaire: "24",
        tva: "20",
        unite: "m²",
      };
      const result = normalizeLigneForOutput(input);
      expect(result.nomPrestation).toBe("Peinture murs");
      expect(result.quantite).toBe(20);
      expect(result.prixUnitaire).toBe(24);
      expect(result.tva).toBe("20");
      expect(result.unite).toBe("m²");
      expect(result.isOptional).toBe(false);
    });

    it("should handle missing values with defaults", () => {
      const result = normalizeLigneForOutput({});
      expect(result.nomPrestation).toBe("Prestation");
      expect(result.quantite).toBe(1);
      expect(result.prixUnitaire).toBe(0);
      expect(result.unite).toBe("U");
    });
  });

  describe("computeTotals", () => {
    it("should compute HT and TTC correctly", () => {
      const lignes: LignePayload[] = [
        { quantite: 10, prixUnitaire: 100, tva: "20" },
        { quantite: 5, prixUnitaire: 50, tva: "20" },
      ];
      const { totalHT, totalTTC } = computeTotals(lignes, 20, 0);
      expect(totalHT).toBe(1250); // 1000 + 250
      expect(totalTTC).toBe(1500); // 1250 * 1.2
    });

    it("should apply discount", () => {
      const lignes: LignePayload[] = [{ quantite: 1, prixUnitaire: 1000, tva: "20" }];
      const { totalHT, totalTTC } = computeTotals(lignes, 20, 10);
      expect(totalHT).toBe(900); // 1000 * 0.9
      expect(totalTTC).toBe(1080); // 900 * 1.2
    });

    it("should skip optional lines", () => {
      const lignes: LignePayload[] = [
        { quantite: 1, prixUnitaire: 100, tva: "20" },
        { quantite: 1, prixUnitaire: 200, tva: "20", isOptional: true },
      ];
      const { totalHT } = computeTotals(lignes, 20, 0);
      expect(totalHT).toBe(100);
    });

    it("should handle multi-TVA", () => {
      const lignes: LignePayload[] = [
        { quantite: 1, prixUnitaire: 100, tva: "10" },
        { quantite: 1, prixUnitaire: 100, tva: "20" },
      ];
      const { totalTTC } = computeTotals(lignes, 20, 0);
      // (100 * 1.10) + (100 * 1.20) = 110 + 120 = 230
      expect(totalTTC).toBe(230);
    });
  });
});
