import { z } from "zod";

export const createRelationSchema = z.object({
  targetTaskId: z
    .string({ required_error: "Target task ID is required" })
    .min(1, "Target task ID is required"),
  relationType: z.enum(
    [
      "PARENT_CHILD",
      "BLOCKS",
      "BLOCKED_BY",
      "RELATES_TO",
      "DUPLICATES",
      "DUPLICATE_OF",
    ],
    {
      errorMap: () => ({
        message:
          "Invalid relation type. Use: PARENT_CHILD, BLOCKS, BLOCKED_BY, RELATES_TO, DUPLICATES, or DUPLICATE_OF",
      }),
    },
  ),
});
