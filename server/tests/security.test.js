import request from "supertest";
import app from "../src/app.js";
import prisma from "../src/config/database.js";

describe("Security Headers", () => {
  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("should have Helmet headers", async () => {
    const res = await request(app).get("/api/health");
    expect(res.headers["content-security-policy"]).toBeDefined();
    expect(res.headers["x-dns-prefetch-control"]).toBeDefined();
    expect(res.headers["x-frame-options"]).toBeDefined();
    expect(res.headers["strict-transport-security"]).toBeDefined();
  });
});
