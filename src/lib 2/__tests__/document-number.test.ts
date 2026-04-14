import { describe, it, expect, vi } from "vitest";
import { generateSequentialDocumentNumber } from "../document-number";

describe("document-number", () => {
  const currentYear = new Date().getFullYear();

  describe("generateSequentialDocumentNumber", () => {
    it("should start at 001 when no previous devis exists", async () => {
      const findLatest = vi.fn().mockResolvedValue(null);
      const result = await generateSequentialDocumentNumber({
        prefix: "DEV",
        userId: "user_1",
        findLatest,
      });

      expect(result).toBe(`DEV-${currentYear}-001`);
      expect(findLatest).toHaveBeenCalledWith(`DEV-${currentYear}-`);
    });

    it("should increment from the latest number", async () => {
      const findLatest = vi.fn().mockResolvedValue({ numero: `DEV-${currentYear}-042` });
      const result = await generateSequentialDocumentNumber({
        prefix: "DEV",
        userId: "user_1",
        findLatest,
      });

      expect(result).toBe(`DEV-${currentYear}-043`);
    });

    it("should handle FAT prefix for factures", async () => {
      const findLatest = vi.fn().mockResolvedValue({ numero: `FAT-${currentYear}-007` });
      const result = await generateSequentialDocumentNumber({
        prefix: "FAT",
        userId: "user_1",
        findLatest,
      });

      expect(result).toBe(`FAT-${currentYear}-008`);
    });

    it("should pad numbers to 3 digits", async () => {
      const findLatest = vi.fn().mockResolvedValue({ numero: `DEV-${currentYear}-001` });
      const result = await generateSequentialDocumentNumber({
        prefix: "DEV",
        userId: "user_1",
        findLatest,
      });

      expect(result).toBe(`DEV-${currentYear}-002`);
    });

    it("should throw when sequence exceeds 999", async () => {
      const findLatest = vi.fn().mockResolvedValue({ numero: `DEV-${currentYear}-999` });

      await expect(
        generateSequentialDocumentNumber({
          prefix: "DEV",
          userId: "user_1",
          findLatest,
        })
      ).rejects.toThrow("Impossible de générer un numéro DEV pour user_1");
    });

    it("should handle non-numeric suffix gracefully", async () => {
      const findLatest = vi.fn().mockResolvedValue({ numero: `DEV-${currentYear}-abc` });
      const result = await generateSequentialDocumentNumber({
        prefix: "DEV",
        userId: "user_1",
        findLatest,
      });

      // "abc" → NaN → 0, +1 → 1
      expect(result).toBe(`DEV-${currentYear}-001`);
    });
  });
});
