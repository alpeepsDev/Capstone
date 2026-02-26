import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function resetRateLimits() {
  console.log("🔄 Resetting rate limits...");

  try {
    // 1. Clear API logs to reset current usage
    console.log("🧹 Clearing API logs...");
    await prisma.apiLog.deleteMany({});
    console.log("✅ API logs cleared.");

    // 2. Update Rate Limit Configs to be more generous
    console.log("⚙️ Updating rate limit configurations...");

    const configs = [
      { role: "ADMIN", limit: 5000, window: 3600 }, // 5000 req / hour
      { role: "MANAGER", limit: 5000, window: 3600 }, // 2000 req / hour
      { role: "USER", limit: 5000, window: 3600 }, // 1000 req / hour
    ];

    for (const config of configs) {
      await prisma.rateLimitConfig.upsert({
        where: { role: config.role },
        update: { limit: config.limit, window: config.window },
        create: {
          role: config.role,
          limit: config.limit,
          window: config.window,
          enabled: true,
        },
      });
    }

    console.log("✅ Rate limit configurations updated.");
  } catch (error) {
    console.error("❌ Error resetting rate limits:", error);
  } finally {
    await prisma.$disconnect();
  }
}

resetRateLimits();
