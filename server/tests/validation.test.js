import request from "supertest";
import app from "../src/app.js";

// Mock auth middleware to bypass authentication for these tests if needed
// However, since we are testing validation which might happen before or after auth,
// we should target a public route or mock auth.
// For simplicity, we will test the public login route for body validation
// and a mocked route or existing route for params if possible.
// Since we don't want to depend on DB state, we expect 400 for validation errors.

describe("Validation Middleware", () => {
  describe("Body Validation", () => {
    it("should return 400 for invalid email in login", async () => {
      const res = await request(app).post("/api/v1/users/login").send({
        email: "invalid-email",
        password: "password123",
      });
      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe("Validation errors");
    });

    it("should pass validation for valid email in login", async () => {
      // We expect 401 or 404 or success, but NOT 400 validation error
      // The controller might fail because user doesn't exist, but validation should pass.
      const res = await request(app).post("/api/v1/users/login").send({
        email: "user15@example.com",
        password: "password123",
      });
      expect(res.statusCode).not.toBe(400);
    });
  });

  // Note: To test param validation properly without DB side effects or auth blocks,
  // we might need a dedicated test route.
  // However, we can try hitting the admin route. Even if we get 401/403,
  // validation often runs before controller logic.
  // But our middleware order in user.routes.js is: auth -> requireAdmin -> validation.
  // So we would need to mock auth to test validation there.

  // Alternatively, we can rely on the unit tests for schemas if we wrote them,
  // but here we are doing integration.
  // Let's rely on the body validation test which confirms the middleware works in general.
});
