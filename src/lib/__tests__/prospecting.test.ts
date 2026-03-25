import { describe, it, expect } from "vitest";
import {
  normalizeEmail,
  isValidEmail,
  getEmailDomain,
  isPersonalMailbox,
  getProspectCooldownDays,
  getProspectDailyLimit,
} from "../prospecting";

describe("prospecting", () => {
  describe("normalizeEmail", () => {
    it("should lowercase and trim email", () => {
      expect(normalizeEmail("  HELLO@Example.COM  ")).toBe("hello@example.com");
    });

    it("should handle already normalized email", () => {
      expect(normalizeEmail("test@test.com")).toBe("test@test.com");
    });
  });

  describe("isValidEmail", () => {
    it("should accept valid emails", () => {
      expect(isValidEmail("user@example.com")).toBe(true);
      expect(isValidEmail("test.user+tag@domain.fr")).toBe(true);
    });

    it("should reject invalid emails", () => {
      expect(isValidEmail("")).toBe(false);
      expect(isValidEmail("not-an-email")).toBe(false);
      expect(isValidEmail("@domain.com")).toBe(false);
      expect(isValidEmail("user@")).toBe(false);
      expect(isValidEmail("user@.com")).toBe(false);
    });
  });

  describe("getEmailDomain", () => {
    it("should extract domain from email", () => {
      expect(getEmailDomain("user@example.com")).toBe("example.com");
      expect(getEmailDomain("test@sub.domain.fr")).toBe("sub.domain.fr");
    });

    it("should return empty string for invalid email", () => {
      expect(getEmailDomain("invalid")).toBe("");
      expect(getEmailDomain("")).toBe("");
    });
  });

  describe("isPersonalMailbox", () => {
    it("should detect personal mailboxes", () => {
      expect(isPersonalMailbox("user@gmail.com")).toBe(true);
      expect(isPersonalMailbox("user@yahoo.fr")).toBe(true);
      expect(isPersonalMailbox("user@outlook.com")).toBe(true);
      expect(isPersonalMailbox("user@free.fr")).toBe(true);
    });

    it("should accept professional mailboxes", () => {
      expect(isPersonalMailbox("user@entreprise.fr")).toBe(false);
      expect(isPersonalMailbox("user@mon-artisan.com")).toBe(false);
    });
  });

  describe("getProspectCooldownDays", () => {
    it("should return default value", () => {
      // Without env var, should return 60
      expect(getProspectCooldownDays()).toBe(60);
    });
  });

  describe("getProspectDailyLimit", () => {
    it("should return default value", () => {
      // Without env var, should return 10
      expect(getProspectDailyLimit()).toBe(10);
    });
  });
});
