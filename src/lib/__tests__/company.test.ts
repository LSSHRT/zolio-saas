import { describe, it, expect } from "vitest";
import { getCompanyProfile, type CompanyProfile } from "../company";

describe("company", () => {
  describe("getCompanyProfile", () => {
    it("should return defaults when user is null", () => {
      const profile = getCompanyProfile(null);
      expect(profile.nom).toBe("Mon Entreprise");
      expect(profile.email).toBe("");
      expect(profile.color).toBe("#0ea5e9");
    });

    it("should read from unsafeMetadata first", () => {
      const user = {
        firstName: "Jean",
        lastName: "Dupont",
        emailAddresses: [{ emailAddress: "jean@test.com" }],
        unsafeMetadata: {
          companyName: "Dupont BTP",
          companyPhone: "0612345678",
          companyAddress: "123 Rue de Paris",
          companySiret: "12345678901234",
          companyColor: "#ff0000",
        },
        publicMetadata: {},
      };

      const profile = getCompanyProfile(user);
      expect(profile.nom).toBe("Dupont BTP");
      expect(profile.telephone).toBe("0612345678");
      expect(profile.adresse).toBe("123 Rue de Paris");
      expect(profile.siret).toBe("12345678901234");
      expect(profile.color).toBe("#ff0000");
      expect(profile.email).toBe("jean@test.com");
    });

    it("should fallback to publicMetadata if unsafeMetadata is empty", () => {
      const user = {
        firstName: "Marie",
        lastName: "Martin",
        emailAddresses: [{ emailAddress: "marie@test.com" }],
        unsafeMetadata: {},
        publicMetadata: {
          companyName: "Martin Peinture",
        },
      };

      const profile = getCompanyProfile(user);
      expect(profile.nom).toBe("Martin Peinture");
    });

    it("should fallback to firstName lastName if no companyName", () => {
      const user = {
        firstName: "Pierre",
        lastName: "Durand",
        emailAddresses: [{ emailAddress: "pierre@test.com" }],
        unsafeMetadata: {},
        publicMetadata: {},
      };

      const profile = getCompanyProfile(user);
      expect(profile.nom).toBe("Pierre Durand");
    });
  });
});
