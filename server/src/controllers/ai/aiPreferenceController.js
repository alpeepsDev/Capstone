import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Get user's AI preferences
export const getAIPreferences = async (req, res) => {
  try {
    const userId = req.user.id;

    let preferences = await prisma.userAIPreference.findUnique({
      where: { userId },
    });

    // Create default preferences if they don't exist
    if (!preferences) {
      preferences = await prisma.userAIPreference.create({
        data: {
          userId,
          enableProactiveNotifs: true,
          enableAutoAssignment: false, // Opt-in
          enableAutoEscalation: true,
          deadlineWarningDays: [1, 3, 7],
          preferredInsightTypes: [
            "RISK_DETECTED",
            "DEADLINE_WARNING",
            "PATTERN_FOUND",
          ],
        },
      });
    }

    res.json({
      success: true,
      data: preferences,
    });
  } catch (error) {
    console.error("[AI Preferences] Error fetching preferences:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch AI preferences",
    });
  }
};

// Update AI preferences
export const updateAIPreferences = async (req, res) => {
  try {
    const userId = req.user.id;
    const updateData = req.body;

    // Allowed fields for update
    const allowedFields = [
      "enableProactiveNotifs",
      "enableAutoAssignment",
      "enableAutoEscalation",
      "deadlineWarningDays",
      "preferredInsightTypes",
      "weeklyReportDay",
      "weeklyReportTime",
      "notificationQuietHours",
    ];

    // Filter only allowed fields
    const filteredData = {};
    Object.keys(updateData).forEach((key) => {
      if (allowedFields.includes(key)) {
        filteredData[key] = updateData[key];
      }
    });

    const preferences = await prisma.userAIPreference.upsert({
      where: { userId },
      update: filteredData,
      create: {
        userId,
        ...filteredData,
      },
    });

    res.json({
      success: true,
      data: preferences,
      message: "AI preferences updated successfully",
    });
  } catch (error) {
    console.error("[AI Preferences] Error updating preferences:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update AI preferences",
    });
  }
};

// Reset to default preferences
export const resetAIPreferences = async (req, res) => {
  try {
    const userId = req.user.id;

    const preferences = await prisma.userAIPreference.upsert({
      where: { userId },
      update: {
        enableProactiveNotifs: true,
        enableAutoAssignment: false,
        enableAutoEscalation: true,
        deadlineWarningDays: [1, 3, 7],
        preferredInsightTypes: [
          "RISK_DETECTED",
          "DEADLINE_WARNING",
          "PATTERN_FOUND",
        ],
        weeklyReportDay: null,
        weeklyReportTime: null,
        notificationQuietHours: null,
      },
      create: {
        userId,
        enableProactiveNotifs: true,
        enableAutoAssignment: false,
        enableAutoEscalation: true,
        deadlineWarningDays: [1, 3, 7],
        preferredInsightTypes: [
          "RISK_DETECTED",
          "DEADLINE_WARNING",
          "PATTERN_FOUND",
        ],
      },
    });

    res.json({
      success: true,
      data: preferences,
      message: "AI preferences reset to defaults",
    });
  } catch (error) {
    console.error("[AI Preferences] Error resetting preferences:", error);
    res.status(500).json({
      success: false,
      message: "Failed to reset AI preferences",
    });
  }
};
