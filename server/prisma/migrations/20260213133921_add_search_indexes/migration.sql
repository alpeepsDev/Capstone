-- CreateEnum
CREATE TYPE "TaskRiskLevel" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "TaskType" AS ENUM ('TASK', 'STORY', 'BUG', 'EPIC', 'SUBTASK');

-- CreateEnum
CREATE TYPE "TaskRelationType" AS ENUM ('PARENT_CHILD', 'BLOCKS', 'BLOCKED_BY', 'RELATES_TO', 'DUPLICATES', 'DUPLICATE_OF');

-- CreateEnum
CREATE TYPE "InsightType" AS ENUM ('RISK_DETECTED', 'DEADLINE_WARNING', 'PATTERN_FOUND', 'WORKLOAD_IMBALANCE', 'TASK_SUGGESTION', 'PRODUCTIVITY_TIP', 'COMPLETION_PREDICTION', 'BUDGET_ALERT');

-- CreateEnum
CREATE TYPE "AutoActionType" AS ENUM ('AUTO_ASSIGN', 'AUTO_ESCALATE', 'AUTO_SUGGEST_SPLIT', 'AUTO_PRIORITY_UPDATE', 'AUTO_NOTIFICATION');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "NotificationType" ADD VALUE 'MENTION';
ALTER TYPE "NotificationType" ADD VALUE 'AI_INSIGHT';
ALTER TYPE "NotificationType" ADD VALUE 'DEADLINE_WARNING';
ALTER TYPE "NotificationType" ADD VALUE 'RISK_ALERT';
ALTER TYPE "NotificationType" ADD VALUE 'WEEKLY_SUMMARY';
ALTER TYPE "NotificationType" ADD VALUE 'AUTO_ASSIGNMENT';

-- AlterTable
ALTER TABLE "projects" ADD COLUMN     "totalBudget" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "tasks" ADD COLUMN     "epicId" TEXT,
ADD COLUMN     "estimatedHours" DOUBLE PRECISION,
ADD COLUMN     "isOverdue" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "lastActivity" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "originalEstimate" DOUBLE PRECISION,
ADD COLUMN     "parentTaskId" TEXT,
ADD COLUMN     "priorityScore" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "riskLevel" "TaskRiskLevel" NOT NULL DEFAULT 'LOW',
ADD COLUMN     "storyPoints" INTEGER,
ADD COLUMN     "taskType" "TaskType" NOT NULL DEFAULT 'TASK',
ADD COLUMN     "timeRemaining" INTEGER,
ADD COLUMN     "timeSpent" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "budget_categories" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "allocated" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "color" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "budget_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "budget_expenses" (
    "id" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "categoryId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "budget_expenses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "work_logs" (
    "id" TEXT NOT NULL,
    "timeSpent" INTEGER NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "description" TEXT,
    "taskId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "work_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "labels" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "description" TEXT,
    "projectId" TEXT,
    "isGlobal" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "labels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "task_labels" (
    "taskId" TEXT NOT NULL,
    "labelId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "task_labels_pkey" PRIMARY KEY ("taskId","labelId")
);

-- CreateTable
CREATE TABLE "task_relations" (
    "id" TEXT NOT NULL,
    "sourceTaskId" TEXT NOT NULL,
    "targetTaskId" TEXT NOT NULL,
    "relationType" "TaskRelationType" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdById" TEXT NOT NULL,

    CONSTRAINT "task_relations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "task_templates" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "taskType" "TaskType" NOT NULL,
    "projectId" TEXT,
    "priority" "TaskPriority" NOT NULL DEFAULT 'MEDIUM',
    "template" JSONB NOT NULL,
    "createdById" TEXT NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "task_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "task_history" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "field" TEXT NOT NULL,
    "oldValue" TEXT,
    "newValue" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "task_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "saved_filters" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "projectId" TEXT,
    "criteria" JSONB NOT NULL,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "saved_filters_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "nova_insights" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "InsightType" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "taskId" TEXT,
    "projectId" TEXT,
    "actionTaken" BOOLEAN NOT NULL DEFAULT false,
    "dismissed" BOOLEAN NOT NULL DEFAULT false,
    "confidence" DOUBLE PRECISION NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "nova_insights_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_ai_preferences" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "enableProactiveNotifs" BOOLEAN NOT NULL DEFAULT true,
    "enableAutoAssignment" BOOLEAN NOT NULL DEFAULT false,
    "enableAutoEscalation" BOOLEAN NOT NULL DEFAULT true,
    "deadlineWarningDays" INTEGER[] DEFAULT ARRAY[1, 3, 7]::INTEGER[],
    "preferredInsightTypes" TEXT[] DEFAULT ARRAY['RISK_DETECTED', 'DEADLINE_WARNING', 'PATTERN_FOUND']::TEXT[],
    "weeklyReportDay" INTEGER,
    "weeklyReportTime" TEXT,
    "notificationQuietHours" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_ai_preferences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "task_predictions" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "predictedCompletionAt" TIMESTAMP(3) NOT NULL,
    "actualCompletionAt" TIMESTAMP(3),
    "confidence" DOUBLE PRECISION NOT NULL,
    "accuracyScore" DOUBLE PRECISION,
    "factors" JSONB NOT NULL,
    "basedOnSimilarTasks" INTEGER NOT NULL DEFAULT 0,
    "userVelocityFactor" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "task_predictions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "automation_actions" (
    "id" TEXT NOT NULL,
    "type" "AutoActionType" NOT NULL,
    "taskId" TEXT,
    "userId" TEXT,
    "description" TEXT NOT NULL,
    "success" BOOLEAN NOT NULL,
    "metadata" JSONB,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "automation_actions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "task_relations_sourceTaskId_idx" ON "task_relations"("sourceTaskId");

-- CreateIndex
CREATE INDEX "task_relations_targetTaskId_idx" ON "task_relations"("targetTaskId");

-- CreateIndex
CREATE UNIQUE INDEX "task_relations_sourceTaskId_targetTaskId_relationType_key" ON "task_relations"("sourceTaskId", "targetTaskId", "relationType");

-- CreateIndex
CREATE INDEX "task_history_taskId_idx" ON "task_history"("taskId");

-- CreateIndex
CREATE INDEX "task_history_createdAt_idx" ON "task_history"("createdAt");

-- CreateIndex
CREATE INDEX "nova_insights_userId_idx" ON "nova_insights"("userId");

-- CreateIndex
CREATE INDEX "nova_insights_type_idx" ON "nova_insights"("type");

-- CreateIndex
CREATE INDEX "nova_insights_dismissed_idx" ON "nova_insights"("dismissed");

-- CreateIndex
CREATE INDEX "nova_insights_createdAt_idx" ON "nova_insights"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "user_ai_preferences_userId_key" ON "user_ai_preferences"("userId");

-- CreateIndex
CREATE INDEX "task_predictions_taskId_idx" ON "task_predictions"("taskId");

-- CreateIndex
CREATE INDEX "task_predictions_createdAt_idx" ON "task_predictions"("createdAt");

-- CreateIndex
CREATE INDEX "automation_actions_type_idx" ON "automation_actions"("type");

-- CreateIndex
CREATE INDEX "automation_actions_success_idx" ON "automation_actions"("success");

-- CreateIndex
CREATE INDEX "automation_actions_createdAt_idx" ON "automation_actions"("createdAt");

-- CreateIndex
CREATE INDEX "projects_name_idx" ON "projects"("name");

-- CreateIndex
CREATE INDEX "projects_description_idx" ON "projects"("description");

-- CreateIndex
CREATE INDEX "tasks_title_idx" ON "tasks"("title");

-- CreateIndex
CREATE INDEX "tasks_description_idx" ON "tasks"("description");

-- AddForeignKey
ALTER TABLE "budget_categories" ADD CONSTRAINT "budget_categories_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "budget_expenses" ADD CONSTRAINT "budget_expenses_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "budget_categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_epicId_fkey" FOREIGN KEY ("epicId") REFERENCES "tasks"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_parentTaskId_fkey" FOREIGN KEY ("parentTaskId") REFERENCES "tasks"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_logs" ADD CONSTRAINT "work_logs_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_logs" ADD CONSTRAINT "work_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "labels" ADD CONSTRAINT "labels_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_labels" ADD CONSTRAINT "task_labels_labelId_fkey" FOREIGN KEY ("labelId") REFERENCES "labels"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_labels" ADD CONSTRAINT "task_labels_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_relations" ADD CONSTRAINT "task_relations_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_relations" ADD CONSTRAINT "task_relations_sourceTaskId_fkey" FOREIGN KEY ("sourceTaskId") REFERENCES "tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_relations" ADD CONSTRAINT "task_relations_targetTaskId_fkey" FOREIGN KEY ("targetTaskId") REFERENCES "tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_templates" ADD CONSTRAINT "task_templates_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_templates" ADD CONSTRAINT "task_templates_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_history" ADD CONSTRAINT "task_history_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_history" ADD CONSTRAINT "task_history_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "saved_filters" ADD CONSTRAINT "saved_filters_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "saved_filters" ADD CONSTRAINT "saved_filters_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nova_insights" ADD CONSTRAINT "nova_insights_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nova_insights" ADD CONSTRAINT "nova_insights_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nova_insights" ADD CONSTRAINT "nova_insights_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_ai_preferences" ADD CONSTRAINT "user_ai_preferences_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_predictions" ADD CONSTRAINT "task_predictions_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "automation_actions" ADD CONSTRAINT "automation_actions_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "automation_actions" ADD CONSTRAINT "automation_actions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
