import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock admin-settings to avoid Prisma dependency
vi.mock("@/lib/admin-settings", () => ({
  appendAdminAuditLog: vi.fn().mockResolvedValue(undefined),
}));

import { logError, logWarn, logInfo, logDebug } from "@/lib/logger";

describe("logger", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.spyOn(console, "info").mockImplementation(() => {});
    vi.spyOn(console, "log").mockImplementation(() => {});
  });

  describe("logError", () => {
    it("should call console.error with prefix and error", () => {
      const error = new Error("test error");
      logError("test-scope", error);

      expect(console.error).toHaveBeenCalledWith("[ERROR] [test-scope]", error);
    });

    it("should handle non-Error values", () => {
      logError("test-scope", "string error");

      expect(console.error).toHaveBeenCalledWith("[ERROR] [test-scope]", "string error");
    });

    it("should use custom message when provided", () => {
      const error = new Error("test error");
      logError("test-scope", error, "Custom message");

      expect(console.error).toHaveBeenCalledWith("[ERROR] [test-scope]", error);
    });
  });

  describe("logWarn", () => {
    it("should call console.warn with prefix", () => {
      logWarn("test-scope", "warning message");

      // padEnd(5) adds trailing space for WARN (4 chars)
      expect(console.warn).toHaveBeenCalledWith("[WARN ] [test-scope]", "warning message");
    });
  });

  describe("logInfo", () => {
    it("should call console.info with prefix", () => {
      logInfo("test-scope", "info message");

      // padEnd(5) adds trailing space for INFO (4 chars)
      expect(console.info).toHaveBeenCalledWith("[INFO ] [test-scope]", "info message");
    });
  });

  describe("logDebug", () => {
    it("should call console.log in non-production", () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = "development";

      logDebug("test-scope", "debug message");

      expect(console.log).toHaveBeenCalledWith("[LOG  ] [test-scope]", "debug message");

      process.env.NODE_ENV = originalEnv;
    });

    it("should not log in production", () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = "production";

      logDebug("test-scope", "debug message");

      expect(console.log).not.toHaveBeenCalled();

      process.env.NODE_ENV = originalEnv;
    });
  });
});
