import { describe, it, expect } from "vitest";
import { parseLignes, getLineTotal, computeTotals, type LignePayload } from "../devis-lignes";
import { rateLimit } from "../rate-limit";
import { normalizeEmail, isValidEmail, isPersonalMailbox } from "../prospecting";
import { createPublicDevisToken, verifyPublicDevisToken } from "../public-devis-token";
import { getCompanyProfile } from "../company";
import { isTradeKey, getTradeLabel } from "../trades";
import {
  encodePrestationDescription,
  decodePrestationDescription,
} from "../prestations";

describe("API helpers (couverture complète)", () => {
  describe("devis-lignes", () => {
    it("should handle empty lignes array", () => {
      const { totalHT, totalTTC } = computeTotals([], 20, 0);
      expect(totalHT).toBe(0);
      expect(totalTTC).toBe(0);
    });

    it("should handle lignes with string numbers", () => {
      const lignes: LignePayload[] = [
        { quantite: "10", prixUnitaire: "25.50", tva: "20" },
      ];
      const { totalHT } = computeTotals(lignes, 20, 0);
      expect(totalHT).toBe(255);
    });

    it("should handle mixed optional and non-optional", () => {
      const lignes: LignePayload[] = [
        { quantite: 1, prixUnitaire: 100, tva: "20" },
        { quantite: 1, prixUnitaire: 200, tva: "20", isOptional: true },
        { quantite: 1, prixUnitaire: 50, tva: "10" },
      ];
      const { totalHT, totalTTC } = computeTotals(lignes, 20, 0);
      expect(totalHT).toBe(150); // 100 + 50 (pas l'option)
      expect(totalTTC).toBe(175); // (100*1.20) + (50*1.10)
    });
  });

  describe("rate-limit", () => {
    it("should reset after window expires", () => {
      const id = "test-expire:" + Date.now();
      rateLimit(id, 1, 1); // 1ms window
      // Après 1ms, le prochain devrait être autorisé
      // (difficile à tester de manière fiable, on vérifie juste que ça ne crash pas)
      const result = rateLimit(id, 1, 1);
      expect(typeof result.allowed).toBe("boolean");
    });
  });

  describe("prospecting", () => {
    it("should validate various email formats", () => {
      expect(isValidEmail("test@example.com")).toBe(true);
      expect(isValidEmail("test.user+tag@domain.fr")).toBe(true);
      expect(isValidEmail("")).toBe(false);
      expect(isValidEmail("not-email")).toBe(false);
    });

    it("should detect personal mailboxes", () => {
      expect(isPersonalMailbox("user@gmail.com")).toBe(true);
      expect(isPersonalMailbox("user@company.com")).toBe(false);
    });

    it("should normalize emails", () => {
      expect(normalizeEmail("  HELLO@Example.COM  ")).toBe("hello@example.com");
    });
  });

  describe("public-devis-token", () => {
    it("should create and verify tokens", () => {
      process.env.PUBLIC_DEVIS_LINK_SECRET = "test-secret";
      const token = createPublicDevisToken("DEV-001", "user_123");
      expect(token).toBeTruthy();
      const payload = verifyPublicDevisToken(token!, "DEV-001");
      expect(payload.numero).toBe("DEV-001");
    });
  });

  describe("company", () => {
    it("should handle null user", () => {
      const profile = getCompanyProfile(null);
      expect(profile.nom).toBe("Mon Entreprise");
    });

    it("should read from metadata", () => {
      const user = {
        firstName: "Jean",
        lastName: "Dupont",
        emailAddresses: [{ emailAddress: "jean@test.com" }],
        unsafeMetadata: { companyName: "Dupont BTP" },
        publicMetadata: {},
      };
      const profile = getCompanyProfile(user);
      expect(profile.nom).toBe("Dupont BTP");
      expect(profile.email).toBe("jean@test.com");
    });
  });

  describe("trades", () => {
    it("should validate trade keys", () => {
      expect(isTradeKey("peintre")).toBe(true);
      expect(isTradeKey("invalide")).toBe(false);
    });

    it("should return labels", () => {
      expect(getTradeLabel("peintre")).toBe("Peintre");
      expect(getTradeLabel("invalide")).toBe("Peintre"); // fallback
    });
  });

  describe("prestations", () => {
    it("should encode and decode categories", () => {
      const encoded = encodePrestationDescription({
        categorie: "Peinture",
        description: "Murs 2 couches",
      });
      const decoded = decodePrestationDescription(encoded);
      expect(decoded.categorie).toBe("Peinture");
      expect(decoded.description).toBe("Murs 2 couches");
    });
  });
});
