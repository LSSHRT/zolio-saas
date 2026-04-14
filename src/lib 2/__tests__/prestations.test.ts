import { describe, it, expect } from "vitest";
import {
  encodePrestationDescription,
  decodePrestationDescription,
  mapPrestationForClient,
  buildPrestationCreateData,
} from "../prestations";

describe("prestations", () => {
  describe("encodePrestationDescription", () => {
    it("should encode category into description", () => {
      const result = encodePrestationDescription({
        categorie: "Peinture",
        description: "Peinture murs 2 couches",
      });
      expect(result).toContain("[[zolio-category:Peinture]]");
      expect(result).toContain("Peinture murs 2 couches");
    });

    it("should handle missing description", () => {
      const result = encodePrestationDescription({
        categorie: "Peinture",
        description: null,
      });
      expect(result).toBe("[[zolio-category:Peinture]]");
    });

    it("should handle missing category", () => {
      const result = encodePrestationDescription({
        categorie: null,
        description: "Just a description",
      });
      expect(result).toBe("Just a description");
    });

    it("should handle both missing", () => {
      const result = encodePrestationDescription({
        categorie: null,
        description: null,
      });
      expect(result).toBe("");
    });

    it("should trim whitespace from inputs", () => {
      const result = encodePrestationDescription({
        categorie: "  Peinture  ",
        description: "  Text  ",
      });
      expect(result).toContain("[[zolio-category:Peinture]]");
      expect(result).toContain("Text");
    });
  });

  describe("decodePrestationDescription", () => {
    it("should decode encoded description", () => {
      const encoded = "[[zolio-category:Peinture]]\nPeinture murs";
      const result = decodePrestationDescription(encoded);
      expect(result.categorie).toBe("Peinture");
      expect(result.description).toBe("Peinture murs");
    });

    it("should handle description without category", () => {
      const result = decodePrestationDescription("Just a description");
      expect(result.categorie).toBe("Autre");
      expect(result.description).toBe("Just a description");
    });

    it("should handle null/undefined", () => {
      const result = decodePrestationDescription(null);
      expect(result.categorie).toBe("Autre");
      expect(result.description).toBe("");
    });

    it("should roundtrip encode/decode", () => {
      const original = { categorie: "Préparation", description: "Rebouchage et ponçage" };
      const encoded = encodePrestationDescription(original);
      const decoded = decodePrestationDescription(encoded);
      expect(decoded.categorie).toBe(original.categorie);
      expect(decoded.description).toBe(original.description);
    });

    it("should handle empty category", () => {
      const encoded = "[[zolio-category:]]\nSome description";
      const result = decodePrestationDescription(encoded);
      expect(result.categorie).toBe("Autre");
      expect(result.description).toBe("Some description");
    });
  });

  describe("mapPrestationForClient", () => {
    it("should map and decode a prestation record", () => {
      const record = {
        id: "123",
        nom: "Peinture murs",
        description: "[[zolio-category:Peinture]]\n2 couches satinée",
        unite: "m²",
        prix: 24,
        cout: 5,
        stock: null,
      };

      const result = mapPrestationForClient(record);
      expect(result.id).toBe("123");
      expect(result.categorie).toBe("Peinture");
      expect(result.nom).toBe("Peinture murs");
      expect(result.description).toBe("2 couches satinée");
      expect(result.unite).toBe("m²");
      expect(result.prix).toBe(24);
      expect(result.cout).toBe(5);
      expect(result.stock).toBe(0);
    });
  });

  describe("buildPrestationCreateData", () => {
    it("should build data with encoded description", () => {
      const result = buildPrestationCreateData("user_1", {
        nom: "Peinture murs",
        categorie: "Peinture",
        description: "2 couches satinée",
        prix: "24",
        cout: "5",
        stock: "0",
        unite: "m²",
      });

      expect(result.userId).toBe("user_1");
      expect(result.nom).toBe("Peinture murs");
      expect(result.description).toContain("[[zolio-category:Peinture]]");
      expect(result.prix).toBe(24);
      expect(result.cout).toBe(5);
      expect(result.unite).toBe("m²");
    });

    it("should handle invalid numeric inputs gracefully", () => {
      const result = buildPrestationCreateData("user_1", {
        nom: "Test",
        prix: "not-a-number",
        cout: null,
        stock: null,
      });

      expect(result.prix).toBe(0);
      expect(result.cout).toBe(0);
      expect(result.stock).toBe(0);
    });
  });
});
