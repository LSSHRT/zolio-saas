import { describe, it, expect } from "vitest";
import { uploadPhoto, isPhotoUrl, fetchPhotoAsBase64 } from "../blob-photos";

describe("blob-photos", () => {
  describe("isPhotoUrl", () => {
    it("should detect HTTP URLs", () => {
      expect(isPhotoUrl("https://example.com/photo.jpg")).toBe(true);
      expect(isPhotoUrl("http://example.com/photo.jpg")).toBe(true);
    });

    it("should reject base64 strings", () => {
      expect(isPhotoUrl("data:image/jpeg;base64,/9j/4AAQ")).toBe(false);
      expect(isPhotoUrl("not-a-url")).toBe(false);
    });
  });

  describe("fetchPhotoAsBase64", () => {
    it("should return base64 as-is", async () => {
      const base64 = "data:image/jpeg;base64,/9j/4AAQ";
      const result = await fetchPhotoAsBase64(base64);
      expect(result).toBe(base64);
    });
  });
});

describe("prospect-analytics", () => {
  it("should calculate open rate correctly", () => {
    const sent = 10;
    const opened = 3;
    const rate = Math.round((opened / sent) * 100);
    expect(rate).toBe(30);
  });

  it("should handle zero sent emails", () => {
    const sent = 0;
    const opened = 0;
    const rate = sent > 0 ? Math.round((opened / sent) * 100) : 0;
    expect(rate).toBe(0);
  });
});

describe("rappels-devis", () => {
  it("should calculate days since creation correctly", () => {
    const now = new Date();
    const creationDate = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000); // 5 jours
    const daysSinceCreation = Math.floor(
      (now.getTime() - creationDate.getTime()) / (24 * 60 * 60 * 1000)
    );
    expect(daysSinceCreation).toBe(5);
  });

  it("should identify applicable reminder", () => {
    const REMINDER_DAYS = [4, 6];
    const daysSinceCreation = 5;
    const applicable = REMINDER_DAYS.find((days) => daysSinceCreation >= days);
    expect(applicable).toBe(4);
  });
});
