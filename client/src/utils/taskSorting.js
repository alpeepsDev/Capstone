const PRIORITY_ORDER = ["URGENT", "HIGH", "MEDIUM", "LOW"];

const getPriorityOrder = (priority) => {
  if (!priority) return PRIORITY_ORDER.length;
  const normalized = String(priority).toUpperCase();
  const index = PRIORITY_ORDER.indexOf(normalized);
  return index === -1 ? PRIORITY_ORDER.length : index;
};

const STATUS_BUCKETS = {
  PENDING: 0,
  IN_PROGRESS: 0,
  IN_REVIEW: 1,
  COMPLETED: 2,
};

const getStatusBucket = (status) => {
  if (!status) return 3;
  const normalized = String(status).toUpperCase();
  return STATUS_BUCKETS.hasOwnProperty(normalized)
    ? STATUS_BUCKETS[normalized]
    : 3;
};

const getTimestamp = (task) => {
  const dateField =
    task?.updatedAt || task?.dueDate || task?.createdAt || task?.startDate;
  const timestamp = dateField ? new Date(dateField).getTime() : 0;
  return Number.isFinite(timestamp) ? timestamp : 0;
};

export const sortTasksByPriorityAndStatus = (tasks = []) => {
  if (!Array.isArray(tasks)) return [];

  return [...tasks].sort((a, b) => {
    const bucketA = getStatusBucket(a?.status);
    const bucketB = getStatusBucket(b?.status);

    if (bucketA !== bucketB) {
      return bucketA - bucketB;
    }

    const priorityDiff =
      getPriorityOrder(a?.priority) - getPriorityOrder(b?.priority);
    if (priorityDiff !== 0) {
      return priorityDiff;
    }

    return getTimestamp(a) - getTimestamp(b);
  });
};
