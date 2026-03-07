import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Starting DB cleanup script...");

  try {
    // 1. Convert any users with 'MODERATOR' role to 'USER' via raw SQL since Prisma 'MODERATOR' is invalid enum
    const updatedUsers = await prisma.$executeRaw`
      UPDATE "users" 
      SET "role" = 'USER'::"UserRole" 
      WHERE "role" = 'MODERATOR'::"UserRole"
    `;
    console.log(`Updated ${updatedUsers} users from MODERATOR to USER.`);

    // 2. Delete any rate limits specifically for MODERATOR
    const deletedRateLimits = await prisma.$executeRaw`
      DELETE FROM "rate_limit_configs"
      WHERE "role" = 'MODERATOR'::"UserRole"
    `;
    console.log(`Deleted ${deletedRateLimits} rate limit configs for MODERATORs.`);

    // 3. Update the Postgres enum UserRole to remove 'MODERATOR' and replace it with a new one
    // In PostgreSQL, you can't easily remove a value from an ENUM. 
    // Best way is to rename the old, create a new one, update, and drop old.
    
    console.log("Recreating UserRole enum in PostgreSQL to remove 'MODERATOR'...");
    
    await prisma.$executeRaw`ALTER TYPE "UserRole" RENAME TO "UserRole_old";`;
    await prisma.$executeRaw`CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'MANAGER', 'USER');`;
    await prisma.$executeRaw`ALTER TABLE "users" ALTER COLUMN "role" DROP DEFAULT;`;
    await prisma.$executeRaw`ALTER TABLE "users" ALTER COLUMN "role" TYPE "UserRole" USING "role"::text::"UserRole";`;
    await prisma.$executeRaw`ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'USER'::"UserRole";`;
    await prisma.$executeRaw`ALTER TABLE "rate_limit_configs" ALTER COLUMN "role" TYPE "UserRole" USING "role"::text::"UserRole";`;
    await prisma.$executeRaw`DROP TYPE "UserRole_old";`;
    
    console.log("Successfully recreated UserRole enum.");

  } catch (error) {
    console.error("Error during DB cleanup:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
