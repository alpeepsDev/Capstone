import { jest } from "@jest/globals";
import {
  askNovaSchema,
  proofreadSchema,
} from "../src/validations/ai.validation.js";
import { validateRequest } from "../src/middleware/validation.middleware.js";
import { z } from "zod";

describe("AI Validation Schemas", () => {
  describe("askNovaSchema", () => {
    it("should validate a correct query", () => {
      const validData = { query: "What are my tasks?" };
      const result = askNovaSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it("should fail for empty query", () => {
      const invalidData = { query: "" };
      const result = askNovaSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      expect(result.error.issues[0].message).toBe("Query cannot be empty");
    });

    it("should fail for too long query", () => {
      const longQuery = "a".repeat(501);
      const invalidData = { query: longQuery };
      const result = askNovaSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      expect(result.error.issues[0].message).toContain("Query is too long");
    });

    it("should fail for missing query", () => {
      const invalidData = {};
      const result = askNovaSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      expect(result.error.issues[0].message).toBe("Query is required");
    });
  });

  describe("proofreadSchema", () => {
    it("should validate correct text", () => {
      const validData = { text: "Hello world" };
      const result = proofreadSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it("should fail for empty text", () => {
      const invalidData = { text: "" };
      const result = proofreadSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      expect(result.error.issues[0].message).toBe("Text cannot be empty");
    });

    it("should fail for too long text", () => {
      const longText = "a".repeat(2001);
      const invalidData = { text: longText };
      const result = proofreadSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      expect(result.error.issues[0].message).toContain("Text is too long");
    });
  });
});

describe("Validation Middleware", () => {
  it("should call next() if validation passes", () => {
    const schema = z.object({ foo: z.string() });
    const req = { body: { foo: "bar" } };
    const res = {};
    const next = jest.fn();

    const middleware = validateRequest(schema, "body");
    middleware(req, res, next);

    expect(next).toHaveBeenCalled();
  });

  it("should return 400 if validation fails", () => {
    const schema = z.object({ foo: z.string() });
    const req = { body: { foo: 123 } };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    const next = jest.fn();

    const middleware = validateRequest(schema, "body");
    middleware(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: "Validation errors",
      }),
    );
  });
});
