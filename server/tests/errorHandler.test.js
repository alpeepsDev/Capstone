import express from "express";
import request from "supertest";
import { errorHandler } from "../src/middleware/errorHandler.js";
import AppError from "../src/utils/AppError.js";

const buildApp = (routeHandler) => {
  const app = express();
  app.get("/test", routeHandler);
  app.use(errorHandler);
  return app;
};

describe("errorHandler", () => {
  it("should not leak internal error messages for unknown errors", async () => {
    const app = buildApp((req, res, next) => {
      next(new Error("Database connection error: host=prod-db password=secret"));
    });

    const res = await request(app).get("/test");

    expect(res.status).toBe(500);
    expect(res.body).toEqual({
      success: false,
      message: "Something went wrong. Please try again.",
    });
    expect(JSON.stringify(res.body)).not.toMatch(/Database connection error/i);
    expect(JSON.stringify(res.body)).not.toMatch(/password/i);
  });

  it("should return AppError public messages", async () => {
    const app = buildApp((req, res, next) => {
      next(new AppError("Only image files are allowed.", { status: 400 }));
    });

    const res = await request(app).get("/test");

    expect(res.status).toBe(400);
    expect(res.body).toEqual({
      success: false,
      message: "Only image files are allowed.",
    });
  });

  it("should map Prisma P2002 to 409", async () => {
    const app = buildApp((req, res, next) => {
      const err = new Error("Unique constraint failed");
      err.code = "P2002";
      next(err);
    });

    const res = await request(app).get("/test");

    expect(res.status).toBe(409);
    expect(res.body).toEqual({
      success: false,
      message: "Resource already exists",
    });
  });

  it("should map Multer LIMIT_FILE_SIZE to a readable 400", async () => {
    const app = buildApp((req, res, next) => {
      const err = new Error("File too large");
      err.name = "MulterError";
      err.code = "LIMIT_FILE_SIZE";
      next(err);
    });

    const res = await request(app).get("/test");

    expect(res.status).toBe(400);
    expect(res.body).toEqual({
      success: false,
      message: "File is too large",
    });
  });
});

