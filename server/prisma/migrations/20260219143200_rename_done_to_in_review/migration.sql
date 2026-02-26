-- AlterEnum: Rename DONE to IN_REVIEW in TaskStatus
-- This is a safe rename that preserves existing data

-- First, rename the enum value from DONE to IN_REVIEW
ALTER TYPE "TaskStatus" RENAME VALUE 'DONE' TO 'IN_REVIEW';
