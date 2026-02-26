/**
 * Nova Automation Rules (Deterministic)
 *
 * These pure functions define the business logic for the AI assistant.
 * They are designed to be testable and predictable.
 */

/**
 * Calculates if a task is overdue.
 * @param {Date|null} dueDate
 * @param {string} status
 * @returns {boolean}
 */
const calculateIsOverdue = (dueDate, status) => {
  if (!dueDate) return false;
  if (
    status === "COMPLETED" ||
    status === "IN_REVIEW" ||
    status === "CANCELLED"
  )
    return false;

  return new Date(dueDate) < new Date();
};

/**
 * Calculates the risk level of a task.
 * @param {boolean} isOverdue
 * @param {Date|string} lastActivity
 * @param {string} priority
 * @returns {'LOW'|'MEDIUM'|'HIGH'|'CRITICAL'}
 */
const calculateRiskLevel = (isOverdue, lastActivity, priority) => {
  // 1. Critical: Overdue and High Priority
  if (isOverdue && (priority === "HIGH" || priority === "URGENT")) {
    return "CRITICAL";
  }

  // 2. High: Overdue OR High Priority with no recent activity
  const daysInactive = lastActivity
    ? (new Date().getTime() - new Date(lastActivity).getTime()) /
      (1000 * 60 * 60 * 24)
    : 0;

  if (isOverdue) return "HIGH";
  if ((priority === "HIGH" || priority === "URGENT") && daysInactive > 3)
    return "HIGH";

  // 3. Medium: Medium priority or inactive for > 7 days
  if (priority === "MEDIUM") return "MEDIUM";
  if (daysInactive > 7) return "MEDIUM";

  // 4. Low: Default
  return "LOW";
};

/**
 * Calculates a numerical priority score (0-100).
 * @param {string} priorityEnum
 * @param {boolean} isOverdue
 * @param {string} riskLevel
 * @returns {number}
 */
const calculatePriorityScore = (priorityEnum, isOverdue, riskLevel) => {
  let score = 0;

  // Base score from priority
  switch (priorityEnum) {
    case "URGENT":
      score += 80;
      break;
    case "HIGH":
      score += 60;
      break;
    case "MEDIUM":
      score += 40;
      break;
    case "LOW":
      score += 20;
      break;
    default:
      score += 20;
  }

  // Modifiers
  if (isOverdue) score += 30;
  if (riskLevel === "CRITICAL") score += 20;
  if (riskLevel === "HIGH") score += 10;

  // Cap at 100
  return Math.min(score, 100);
};

export { calculateIsOverdue, calculateRiskLevel, calculatePriorityScore };
