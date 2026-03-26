import { describe, it, expect } from "vitest";
import {
  isTradeKey,
  getTradeDefinition,
  getTradeLabel,
  getStarterCatalogForTrade,
  getTradeBundlesForTrade,
  TRADE_OPTIONS,
  DEFAULT_TRADE,
  type TradeKey,
} from "../trades";

describe("trades", () => {
  const allTradeKeys: TradeKey[] = ["peintre", "plaquiste", "plombier", "electricien"];

  describe("isTradeKey", () => {
    it.each(allTradeKeys)("should accept valid trade key: %s", (key) => {
      expect(isTradeKey(key)).toBe(true);
    });

    it("should reject invalid values", () => {
      expect(isTradeKey("")).toBe(false);
      expect(isTradeKey("macon")).toBe(false);
      expect(isTradeKey(undefined)).toBe(false);
      expect(isTradeKey(null)).toBe(false);
      expect(isTradeKey(123)).toBe(false);
    });
  });

  describe("getTradeDefinition", () => {
    it.each(allTradeKeys)("should return definition for %s", (key) => {
      const def = getTradeDefinition(key);
      expect(def).not.toBeNull();
      expect(def?.key).toBe(key);
      expect(def?.label).toBeTruthy();
      expect(def?.shortLabel).toBeTruthy();
    });

    it("should return null for invalid key", () => {
      expect(getTradeDefinition("invalide")).toBeNull();
    });
  });

  describe("getTradeLabel", () => {
    it.each(allTradeKeys)("should return label for %s", (key) => {
      const label = getTradeLabel(key);
      expect(label).toBeTruthy();
      expect(typeof label).toBe("string");
    });

    it("should fallback to default for invalid key", () => {
      expect(getTradeLabel("invalide")).toBe("Peintre");
    });
  });

  describe("getStarterCatalogForTrade", () => {
    it.each(allTradeKeys)("should return catalog items for %s", (key) => {
      const catalog = getStarterCatalogForTrade(key);
      expect(catalog.length).toBeGreaterThan(0);
      expect(catalog[0]).toHaveProperty("nom");
      expect(catalog[0]).toHaveProperty("prix");
      expect(catalog[0]).toHaveProperty("unite");
    });

    it("should return copies, not references", () => {
      const a = getStarterCatalogForTrade("peintre");
      const b = getStarterCatalogForTrade("peintre");
      expect(a).not.toBe(b);
      a[0].prix = 9999;
      expect(b[0].prix).not.toBe(9999);
    });

    it("should fallback to default for invalid key", () => {
      const catalog = getStarterCatalogForTrade("invalide");
      expect(catalog.length).toBeGreaterThan(0);
      // Should be peintre (default)
      const defaultCatalog = getStarterCatalogForTrade(DEFAULT_TRADE);
      expect(catalog[0].nom).toBe(defaultCatalog[0].nom);
    });
  });

  describe("getTradeBundlesForTrade", () => {
    it.each(allTradeKeys)("should return bundles for %s", (key) => {
      const bundles = getTradeBundlesForTrade(key);
      expect(bundles.length).toBeGreaterThan(0);
      expect(bundles[0]).toHaveProperty("nom");
      expect(bundles[0]).toHaveProperty("lignes");
      expect(bundles[0].lignes.length).toBeGreaterThan(0);
    });

    it("should return copies, not references", () => {
      const a = getTradeBundlesForTrade("peintre");
      const b = getTradeBundlesForTrade("peintre");
      expect(a).not.toBe(b);
      a[0].nom = "MODIFIED";
      expect(b[0].nom).not.toBe("MODIFIED");
    });
  });

  describe("TRADE_OPTIONS", () => {
    it("should have 4 trades", () => {
      expect(TRADE_OPTIONS).toHaveLength(4);
    });

    it("should have unique keys", () => {
      const keys = TRADE_OPTIONS.map((t) => t.key);
      expect(new Set(keys).size).toBe(keys.length);
    });
  });
});
