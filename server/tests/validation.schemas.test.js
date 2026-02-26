import { describe, it, expect } from "@jest/globals";

// Import all validation schemas
import {
  createProjectSchema,
  updateProjectSchema,
  addMemberSchema,
} from "../src/validations/project.validation.js";
import {
  createTaskSchema,
  updateTaskSchema,
  moveTaskSchema,
  assignTaskSchema,
  addCommentSchema,
} from "../src/validations/task.validation.js";
import {
  updateBudgetSchema,
  addCategorySchema,
  updateCategorySchema,
  addExpenseSchema,
} from "../src/validations/budget.validation.js";
import {
  createExchangeSchema,
  respondExchangeSchema,
} from "../src/validations/exchange.validation.js";
import {
  createLabelSchema,
  updateLabelSchema,
  addLabelToTaskSchema,
} from "../src/validations/label.validation.js";
import {
  createFilterSchema,
  updateFilterSchema,
} from "../src/validations/savedFilter.validation.js";
import { createRelationSchema } from "../src/validations/taskRelation.validation.js";
import {
  createTemplateSchema,
  updateTemplateSchema,
  createFromTemplateSchema,
} from "../src/validations/taskTemplate.validation.js";
import {
  createWorklogSchema,
  updateWorklogSchema,
} from "../src/validations/worklog.validation.js";
import {
  updateRateLimitSchema,
  createEndpointRateLimitSchema,
  updateUserStatusSchema,
  updateUserRoleSchema,
} from "../src/validations/admin.validation.js";
import { searchQuerySchema } from "../src/validations/search.validation.js";
import { updatePreferencesSchema } from "../src/validations/aiPreference.validation.js";
import {
  insightQuerySchema,
  insightHistoryQuerySchema,
} from "../src/validations/insight.validation.js";

// ========== Project Schemas ==========
describe("Project Validation", () => {
  it("accepts valid createProject data", () => {
    const result = createProjectSchema.safeParse({
      name: "My Project",
      description: "A test project",
    });
    expect(result.success).toBe(true);
  });

  it("rejects createProject with empty name", () => {
    const result = createProjectSchema.safeParse({ name: "" });
    expect(result.success).toBe(false);
  });

  it("rejects createProject with missing name", () => {
    const result = createProjectSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it("accepts valid updateProject partial data", () => {
    const result = updateProjectSchema.safeParse({ isActive: false });
    expect(result.success).toBe(true);
  });

  it("accepts addMember with valid userId", () => {
    const result = addMemberSchema.safeParse({ userId: "abc123" });
    expect(result.success).toBe(true);
  });

  it("rejects addMember with empty userId", () => {
    const result = addMemberSchema.safeParse({ userId: "" });
    expect(result.success).toBe(false);
  });
});

// ========== Task Schemas ==========
describe("Task Validation", () => {
  it("accepts valid createTask data", () => {
    const result = createTaskSchema.safeParse({
      title: "New Task",
      projectId: "proj123",
    });
    expect(result.success).toBe(true);
  });

  it("rejects createTask without title", () => {
    const result = createTaskSchema.safeParse({ projectId: "proj123" });
    expect(result.success).toBe(false);
  });

  it("rejects createTask without projectId", () => {
    const result = createTaskSchema.safeParse({ title: "Test" });
    expect(result.success).toBe(false);
  });

  it("accepts valid updateTask with optional fields", () => {
    const result = updateTaskSchema.safeParse({
      status: "IN_PROGRESS",
      priority: "HIGH",
    });
    expect(result.success).toBe(true);
  });

  it("rejects updateTask with invalid status", () => {
    const result = updateTaskSchema.safeParse({ status: "INVALID" });
    expect(result.success).toBe(false);
  });

  it("accepts valid moveTask data", () => {
    const result = moveTaskSchema.safeParse({ status: "DONE" });
    expect(result.success).toBe(true);
  });

  it("rejects moveTask with invalid status", () => {
    const result = moveTaskSchema.safeParse({ status: "UNKNOWN" });
    expect(result.success).toBe(false);
  });

  it("accepts valid assignTask data", () => {
    const result = assignTaskSchema.safeParse({ assigneeId: "user123" });
    expect(result.success).toBe(true);
  });

  it("accepts valid comment", () => {
    const result = addCommentSchema.safeParse({ content: "Looks good!" });
    expect(result.success).toBe(true);
  });

  it("rejects empty comment", () => {
    const result = addCommentSchema.safeParse({ content: "" });
    expect(result.success).toBe(false);
  });
});

// ========== Budget Schemas ==========
describe("Budget Validation", () => {
  it("accepts valid budget update", () => {
    const result = updateBudgetSchema.safeParse({ totalBudget: 5000 });
    expect(result.success).toBe(true);
  });

  it("rejects negative budget", () => {
    const result = updateBudgetSchema.safeParse({ totalBudget: -100 });
    expect(result.success).toBe(false);
  });

  it("rejects non-number budget", () => {
    const result = updateBudgetSchema.safeParse({ totalBudget: "abc" });
    expect(result.success).toBe(false);
  });

  it("accepts valid category", () => {
    const result = addCategorySchema.safeParse({
      name: "Design",
      color: "#ff0000",
    });
    expect(result.success).toBe(true);
  });

  it("rejects category without name", () => {
    const result = addCategorySchema.safeParse({ color: "#ff0000" });
    expect(result.success).toBe(false);
  });

  it("accepts valid expense", () => {
    const result = addExpenseSchema.safeParse({
      description: "Office supplies",
      amount: 150.5,
    });
    expect(result.success).toBe(true);
  });

  it("rejects expense with zero amount", () => {
    const result = addExpenseSchema.safeParse({
      description: "Test",
      amount: 0,
    });
    expect(result.success).toBe(false);
  });

  it("accepts partial category update", () => {
    const result = updateCategorySchema.safeParse({ allocated: 1000 });
    expect(result.success).toBe(true);
  });
});

// ========== Exchange Schemas ==========
describe("Exchange Validation", () => {
  it("accepts valid exchange creation", () => {
    const result = createExchangeSchema.safeParse({
      taskId: "task123",
      receiverId: "user456",
      requestNote: "Please take this task",
    });
    expect(result.success).toBe(true);
  });

  it("rejects exchange without taskId", () => {
    const result = createExchangeSchema.safeParse({ receiverId: "user456" });
    expect(result.success).toBe(false);
  });

  it("accepts valid exchange response", () => {
    const result = respondExchangeSchema.safeParse({ status: "ACCEPTED" });
    expect(result.success).toBe(true);
  });

  it("rejects invalid exchange response status", () => {
    const result = respondExchangeSchema.safeParse({ status: "MAYBE" });
    expect(result.success).toBe(false);
  });
});

// ========== Label Schemas ==========
describe("Label Validation", () => {
  it("accepts valid label creation", () => {
    const result = createLabelSchema.safeParse({
      name: "Bug",
      color: "#ff0000",
    });
    expect(result.success).toBe(true);
  });

  it("rejects label without name", () => {
    const result = createLabelSchema.safeParse({ color: "#ff0000" });
    expect(result.success).toBe(false);
  });

  it("accepts valid label update", () => {
    const result = updateLabelSchema.safeParse({ name: "Feature" });
    expect(result.success).toBe(true);
  });

  it("accepts valid addLabelToTask", () => {
    const result = addLabelToTaskSchema.safeParse({ labelId: "label123" });
    expect(result.success).toBe(true);
  });
});

// ========== Saved Filter Schemas ==========
describe("Saved Filter Validation", () => {
  it("accepts valid filter creation", () => {
    const result = createFilterSchema.safeParse({
      name: "My Filter",
      criteria: { status: "PENDING" },
    });
    expect(result.success).toBe(true);
  });

  it("rejects filter without name", () => {
    const result = createFilterSchema.safeParse({
      criteria: { status: "PENDING" },
    });
    expect(result.success).toBe(false);
  });

  it("accepts valid filter update", () => {
    const result = updateFilterSchema.safeParse({ isPublic: true });
    expect(result.success).toBe(true);
  });
});

// ========== Task Relation Schemas ==========
describe("Task Relation Validation", () => {
  it("accepts valid relation creation", () => {
    const result = createRelationSchema.safeParse({
      targetTaskId: "task456",
      relationType: "BLOCKS",
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid relation type", () => {
    const result = createRelationSchema.safeParse({
      targetTaskId: "task456",
      relationType: "INVALID",
    });
    expect(result.success).toBe(false);
  });

  it("rejects missing targetTaskId", () => {
    const result = createRelationSchema.safeParse({
      relationType: "BLOCKS",
    });
    expect(result.success).toBe(false);
  });
});

// ========== Task Template Schemas ==========
describe("Task Template Validation", () => {
  it("accepts valid template creation", () => {
    const result = createTemplateSchema.safeParse({
      name: "Bug Template",
      taskType: "BUG",
    });
    expect(result.success).toBe(true);
  });

  it("rejects template with invalid taskType", () => {
    const result = createTemplateSchema.safeParse({
      name: "Test",
      taskType: "INVALID_TYPE",
    });
    expect(result.success).toBe(false);
  });

  it("accepts valid template update", () => {
    const result = updateTemplateSchema.safeParse({ name: "Updated" });
    expect(result.success).toBe(true);
  });

  it("accepts valid createFromTemplate data", () => {
    const result = createFromTemplateSchema.safeParse({
      title: "New from template",
      projectId: "proj123",
    });
    expect(result.success).toBe(true);
  });
});

// ========== Worklog Schemas ==========
describe("Worklog Validation", () => {
  it("accepts valid worklog creation", () => {
    const result = createWorklogSchema.safeParse({
      taskId: "task123",
      timeSpent: 60,
    });
    expect(result.success).toBe(true);
  });

  it("rejects worklog without taskId", () => {
    const result = createWorklogSchema.safeParse({ timeSpent: 60 });
    expect(result.success).toBe(false);
  });

  it("rejects worklog with zero timeSpent", () => {
    const result = createWorklogSchema.safeParse({
      taskId: "task123",
      timeSpent: 0,
    });
    expect(result.success).toBe(false);
  });

  it("accepts valid worklog update", () => {
    const result = updateWorklogSchema.safeParse({
      timeSpent: 120,
      description: "Updated work",
    });
    expect(result.success).toBe(true);
  });
});

// ========== Admin Schemas ==========
describe("Admin Validation", () => {
  it("accepts valid rate limit update", () => {
    const result = updateRateLimitSchema.safeParse({ limit: 100 });
    expect(result.success).toBe(true);
  });

  it("rejects rate limit below 1", () => {
    const result = updateRateLimitSchema.safeParse({ limit: 0 });
    expect(result.success).toBe(false);
  });

  it("accepts valid endpoint rate limit creation", () => {
    const result = createEndpointRateLimitSchema.safeParse({
      endpoint: "/api/v1/tasks",
      method: "GET",
      limit: 50,
    });
    expect(result.success).toBe(true);
  });

  it("rejects endpoint rate limit without method", () => {
    const result = createEndpointRateLimitSchema.safeParse({
      endpoint: "/api/v1/tasks",
      limit: 50,
    });
    expect(result.success).toBe(false);
  });

  it("accepts valid user status update", () => {
    const result = updateUserStatusSchema.safeParse({ isActive: false });
    expect(result.success).toBe(true);
  });

  it("rejects non-boolean isActive", () => {
    const result = updateUserStatusSchema.safeParse({ isActive: "yes" });
    expect(result.success).toBe(false);
  });

  it("accepts valid user role update", () => {
    const result = updateUserRoleSchema.safeParse({ role: "ADMIN" });
    expect(result.success).toBe(true);
  });

  it("rejects invalid role", () => {
    const result = updateUserRoleSchema.safeParse({ role: "SUPERADMIN" });
    expect(result.success).toBe(false);
  });
});

// ========== Search Schema ==========
describe("Search Validation", () => {
  it("accepts valid search query", () => {
    const result = searchQuerySchema.safeParse({ query: "fix bug" });
    expect(result.success).toBe(true);
  });

  it("rejects empty search query", () => {
    const result = searchQuerySchema.safeParse({ query: "" });
    expect(result.success).toBe(false);
  });

  it("rejects missing query", () => {
    const result = searchQuerySchema.safeParse({});
    expect(result.success).toBe(false);
  });
});

// ========== AI Preference Schema ==========
describe("AI Preference Validation", () => {
  it("accepts valid preference update", () => {
    const result = updatePreferencesSchema.safeParse({
      enableProactiveNotifs: false,
      deadlineWarningDays: [1, 3],
    });
    expect(result.success).toBe(true);
  });

  it("accepts empty object (all fields optional)", () => {
    const result = updatePreferencesSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it("rejects invalid weeklyReportDay", () => {
    const result = updatePreferencesSchema.safeParse({ weeklyReportDay: 8 });
    expect(result.success).toBe(false);
  });
});

// ========== Insight Schemas ==========
describe("Insight Validation", () => {
  it("accepts valid insight query", () => {
    const result = insightQuerySchema.safeParse({ limit: 10 });
    expect(result.success).toBe(true);
  });

  it("rejects insight limit over 50", () => {
    const result = insightQuerySchema.safeParse({ limit: 100 });
    expect(result.success).toBe(false);
  });

  it("accepts valid history query", () => {
    const result = insightHistoryQuerySchema.safeParse({
      page: 1,
      limit: 20,
    });
    expect(result.success).toBe(true);
  });

  it("rejects page below 1", () => {
    const result = insightHistoryQuerySchema.safeParse({ page: 0 });
    expect(result.success).toBe(false);
  });
});
