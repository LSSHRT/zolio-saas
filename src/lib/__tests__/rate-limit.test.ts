import { describe, it, expect, beforeEach } from "vitest";
import { rateLimit } from "../rate-limit";

describe("rate-limit", () => {
  beforeEach(() => {
    // Le store est en mémoire, pas besoin de reset entre tests
    // car chaque test utilise un identifiant unique
  });

  it("should allow requests within the limit", () => {
    const result = rateLimit("test-allow:1", 3, 60_000);
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(2);
  });

  it("should track multiple requests", () => {
    const id = "test-track:" + Date.now();
    rateLimit(id, 3, 60_000); // 1st
    rateLimit(id, 3, 60_000); // 2nd
    const result = rateLimit(id, 3, 60_000); // 3rd
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(0);
  });

  it("should block when limit exceeded", () => {
    const id = "test-block:" + Date.now();
    rateLimit(id, 2, 60_000); // 1st
    rateLimit(id, 2, 60_000); // 2nd
    const result = rateLimit(id, 2, 60_000); // 3rd — blocked
    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
  });

  it("should have different limits per identifier", () => {
    const r1 = rateLimit("test-per-id:a", 5, 60_000);
    const r2 = rateLimit("test-per-id:b", 5, 60_000);
    expect(r1.allowed).toBe(true);
    expect(r2.allowed).toBe(true);
    expect(r1.remaining).toBe(4);
    expect(r2.remaining).toBe(4);
  });

  it("should return resetAt timestamp", () => {
    const before = Date.now();
    const result = rateLimit("test-reset:" + Date.now(), 5, 60_000);
    expect(result.resetAt).toBeGreaterThan(before);
    expect(result.resetAt).toBeLessThanOrEqual(before + 60_000);
  });
});
