import { jest } from "@jest/globals";

// Define the mock object
const mockPrisma = {
  endpointRateLimit: { findFirst: jest.fn() },
  userRateLimit: { findUnique: jest.fn() },
  rateLimitConfig: { findUnique: jest.fn() },
  apiLog: { count: jest.fn() },
};

// Use unstable_mockModule for ESM support
jest.unstable_mockModule("../src/config/database.js", () => ({
  default: mockPrisma,
}));

// Dynamic import required when using unstable_mockModule
const { rateLimit, endpointRateLimit } =
  await import("../src/middleware/rateLimit.js");

describe("rateLimit middleware", () => {
  let req, res, next;

  beforeEach(() => {
    jest.clearAllMocks();
    req = {
      user: { id: 1, role: "USER" },
      path: "/test",
      method: "GET",
      ip: "127.0.0.1",
      connection: { remoteAddress: "127.0.0.1" },
    };
    res = {
      setHeader: jest.fn(),
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    next = jest.fn();

    // Set default Date.now
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2023-01-01T00:00:00Z"));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe("Priority 1: Endpoint Specific Limit", () => {
    test("should apply endpoint limit when found", async () => {
      // Mock endpoint limit found
      mockPrisma.endpointRateLimit.findFirst.mockResolvedValue({
        limit: 10,
        window: 60,
        method: "GET",
      });

      // Mock request count within limit
      mockPrisma.apiLog.count.mockResolvedValue(5);

      await rateLimit(req, res, next);

      expect(mockPrisma.endpointRateLimit.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ endpoint: "/test" }),
        })
      );

      expect(res.setHeader).toHaveBeenCalledWith("X-RateLimit-Limit", 10);
      expect(res.setHeader).toHaveBeenCalledWith("X-RateLimit-Remaining", 5); // 10 - 5
      expect(res.setHeader).toHaveBeenCalledWith(
        "X-RateLimit-Type",
        "endpoint"
      );
      expect(next).toHaveBeenCalled();
    });

    test("should block when endpoint limit exceeded", async () => {
      mockPrisma.endpointRateLimit.findFirst.mockResolvedValue({
        limit: 10,
        window: 60,
        method: "GET",
      });

      mockPrisma.apiLog.count.mockResolvedValue(10); // Reached limit

      await rateLimit(req, res, next);

      expect(res.status).toHaveBeenCalledWith(429);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining("Endpoint rate limit exceeded"),
        })
      );
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe("Priority 2: User Specific Limit", () => {
    beforeEach(() => {
      // Ensure endpoint limit is not found
      mockPrisma.endpointRateLimit.findFirst.mockResolvedValue(null);
    });

    test("should apply user limit when found", async () => {
      mockPrisma.userRateLimit.findUnique.mockResolvedValue({
        limit: 50,
        window: 3600,
      });

      mockPrisma.apiLog.count.mockResolvedValue(10);

      await rateLimit(req, res, next);

      expect(mockPrisma.userRateLimit.findUnique).toHaveBeenCalledWith({
        where: { userId: 1, enabled: true },
      });

      expect(res.setHeader).toHaveBeenCalledWith("X-RateLimit-Limit", 50);
      expect(res.setHeader).toHaveBeenCalledWith("X-RateLimit-Type", "user");
      expect(next).toHaveBeenCalled();
    });
  });

  describe("Priority 3: Role Based Limit", () => {
    beforeEach(() => {
      mockPrisma.endpointRateLimit.findFirst.mockResolvedValue(null);
      mockPrisma.userRateLimit.findUnique.mockResolvedValue(null);
    });

    test("should apply role limit when found", async () => {
      mockPrisma.rateLimitConfig.findUnique.mockResolvedValue({
        limit: 100,
        window: 3600,
      });

      mockPrisma.apiLog.count.mockResolvedValue(20);

      await rateLimit(req, res, next);

      expect(mockPrisma.rateLimitConfig.findUnique).toHaveBeenCalledWith({
        where: { role: "USER", enabled: true },
      });

      expect(res.setHeader).toHaveBeenCalledWith("X-RateLimit-Limit", 100);
      expect(res.setHeader).toHaveBeenCalledWith("X-RateLimit-Type", "role");
      expect(next).toHaveBeenCalled();
    });

    test("should perform fallback if no role config", async () => {
      mockPrisma.rateLimitConfig.findUnique.mockResolvedValue(null);

      await rateLimit(req, res, next);

      // Defaults: 200 limit
      expect(res.setHeader).toHaveBeenCalledWith("X-RateLimit-Limit", 200);
      expect(next).toHaveBeenCalled();
    });
  });

  describe("Misc", () => {
    test("should next() if no user", async () => {
      req.user = undefined;
      await rateLimit(req, res, next);
      expect(next).toHaveBeenCalled();
      expect(mockPrisma.endpointRateLimit.findFirst).not.toHaveBeenCalled();
    });

    test("should handle errors gracefully", async () => {
      const consoleSpy = jest
        .spyOn(console, "error")
        .mockImplementation(() => {});
      mockPrisma.endpointRateLimit.findFirst.mockRejectedValue(
        new Error("DB Error")
      );

      await rateLimit(req, res, next);

      expect(next).toHaveBeenCalled(); // Should proceed even on error
      consoleSpy.mockRestore();
    });
  });
});

describe("endpointRateLimit factory", () => {
  let req, res, next;

  beforeEach(() => {
    jest.useFakeTimers();
    req = {
      ip: "127.0.0.1",
      originalUrl: "/test-strict",
      connection: { remoteAddress: "127.0.0.1" },
    };
    res = {
      setHeader: jest.fn(),
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    next = jest.fn();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test("should allow requests within limit", () => {
    const limiter = endpointRateLimit(2, 1); // 2 requests per 1 minute

    // First request
    limiter(req, res, next);
    expect(next).toHaveBeenCalled();
    expect(res.setHeader).not.toHaveBeenCalled(); // First request just sets up map

    // Second request
    next.mockClear();
    limiter(req, res, next);
    expect(next).toHaveBeenCalled();
    expect(res.setHeader).toHaveBeenCalledWith("X-RateLimit-Remaining", 0);
  });

  test("should block requests over limit", () => {
    const limiter = endpointRateLimit(1, 1);

    // 1st
    limiter(req, res, next);
    expect(next).toHaveBeenCalled();

    // 2nd
    next.mockClear();
    limiter(req, res, next);
    expect(res.status).toHaveBeenCalledWith(429);
    expect(next).not.toHaveBeenCalled();
  });

  test("should reset after window expires", () => {
    const limiter = endpointRateLimit(1, 1); // 1 min window
    const now = Date.now();

    // 1st request
    limiter(req, res, next);

    // 2nd request - blocked
    next.mockClear();
    res.status.mockClear();
    limiter(req, res, next);
    expect(res.status).toHaveBeenCalledWith(429);

    // Advance time by 61 seconds
    jest.advanceTimersByTime(61000);

    // 3rd request - should pass now
    next.mockClear();
    res.status.mockClear();
    limiter(req, res, next);
    expect(next).toHaveBeenCalled();
  });
});
