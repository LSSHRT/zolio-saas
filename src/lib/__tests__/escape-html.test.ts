import { describe, it, expect } from "vitest";
import { escapeHtml } from "../escape-html";

describe("escapeHtml", () => {
  it("returns identical output for plain text", () => {
    expect(escapeHtml("Bonjour Marc")).toBe("Bonjour Marc");
    expect(escapeHtml("")).toBe("");
  });

  it("escapes the five HTML-significant characters", () => {
    expect(escapeHtml("<")).toBe("&lt;");
    expect(escapeHtml(">")).toBe("&gt;");
    expect(escapeHtml("&")).toBe("&amp;");
    expect(escapeHtml('"')).toBe("&quot;");
    expect(escapeHtml("'")).toBe("&#39;");
  });

  it("processes & before the entities it produces (no double-encoding)", () => {
    // Naive ordering would turn '<' into '&lt;', then re-escape the '&'
    // it just emitted into '&amp;lt;'. Our implementation handles & first.
    expect(escapeHtml("<script>")).toBe("&lt;script&gt;");
    expect(escapeHtml("a & b")).toBe("a &amp; b");
    expect(escapeHtml("Tom & Jerry < Mickey")).toBe(
      "Tom &amp; Jerry &lt; Mickey",
    );
  });

  it("neutralises a typical script-injection payload", () => {
    const payload = `<script>alert("xss")</script>`;
    expect(escapeHtml(payload)).toBe(
      "&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;",
    );
  });

  it("neutralises an attribute-breaking payload", () => {
    // The classic 'inject a closing quote then a new attribute' trick.
    const payload = `" onerror="alert(1)"`;
    expect(escapeHtml(payload)).toBe(
      "&quot; onerror=&quot;alert(1)&quot;",
    );
  });

  it("preserves accented characters and emoji", () => {
    expect(escapeHtml("Élise — Côté chantier 🛠")).toBe(
      "Élise — Côté chantier 🛠",
    );
  });

  it("escapes already-encoded entities literally (& becomes &amp;)", () => {
    // We intentionally do NOT try to detect 'already escaped' input —
    // the escaper is content-agnostic and double-encoding is the safe
    // default when a caller hands us unknown text.
    expect(escapeHtml("&amp;")).toBe("&amp;amp;");
  });
});
