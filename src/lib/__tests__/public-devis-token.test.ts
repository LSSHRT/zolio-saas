import { describe, it, expect, beforeEach } from "vitest";

// Set env var before importing the module
process.env.PUBLIC_DEVIS_LINK_SECRET = "test-secret-key-for-unit-tests";

import {
  createPublicDevisToken,
  verifyPublicDevisToken,
} from "../public-devis-token";

describe("public-devis-token", () => {
  const testNumero = "DEV-001";
  const testUserId = "user_abc123";

  describe("createPublicDevisToken", () => {
    it("should create a valid token", () => {
      const token = createPublicDevisToken(testNumero, testUserId);
      expect(token).toBeTruthy();
      expect(token).toContain(".");
      const parts = token!.split(".");
      expect(parts).toHaveLength(2);
    });

    it("should create different tokens for different users", () => {
      const token1 = createPublicDevisToken(testNumero, "user1");
      const token2 = createPublicDevisToken(testNumero, "user2");
      expect(token1).not.toBe(token2);
    });
  });

  describe("verifyPublicDevisToken", () => {
    it("should verify a valid token", () => {
      const token = createPublicDevisToken(testNumero, testUserId);
      const payload = verifyPublicDevisToken(token!, testNumero);
      expect(payload.numero).toBe(testNumero);
      expect(payload.userId).toBe(testUserId);
    });

    it("should reject token with wrong numero", () => {
      const token = createPublicDevisToken(testNumero, testUserId);
      expect(() => verifyPublicDevisToken(token!, "DEV-999")).toThrow(
        "Token numero mismatch"
      );
    });

    it("should reject invalid token format", () => {
      expect(() => verifyPublicDevisToken("invalid", testNumero)).toThrow(
        "Invalid token format"
      );
    });

    it("should reject token with invalid signature", () => {
      const token = createPublicDevisToken(testNumero, testUserId);
      const parts = token!.split(".");
      const tamperedToken = `${parts[0]}.tampered-signature`;
      expect(() => verifyPublicDevisToken(tamperedToken, testNumero)).toThrow(
        "Invalid token signature"
      );
    });
  });
});
