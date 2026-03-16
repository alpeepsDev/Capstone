import prisma from "../../config/database.js";
import logger from "../../utils/logger.js";

// Get user's AI preferences
export const getAIPreferences = async (req, res) => {
  try {
    const userId = req.user.id;

    let preferences = await prisma.userAIPreference.findUnique({
      where: { userId },
    });

    // If no preferences found, and the user is a regular USER, 
    // try to fetch the global preferences (from an Admin or Manager)
    if (!preferences && req.user.role === "USER") {
      const globalManagerPrefs = await prisma.userAIPreference.findFirst({
        where: {
          user: {
            role: { in: ["ADMIN", "MANAGER"] }
          }
        }
      });
      
      if (globalManagerPrefs) {
        return res.json({
          success: true,
          data: globalManagerPrefs,
        });
      }
    }

    // Create default preferences if they don't exist
    if (!preferences) {
      const defaultData = {
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
      };

      // Only save to DB if they are a MANAGER/ADMIN. Regular users just get the defaults in-memory.
      if (req.user.role === "ADMIN" || req.user.role === "MANAGER") {
        preferences = await prisma.userAIPreference.create({
          data: defaultData,
        });
      } else {
        preferences = defaultData;
      }
    }

    res.json({
      success: true,
      data: preferences,
    });
  } catch (error) {
    logger.error("[AI Preferences] Error fetching preferences:", error);
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
    logger.error("[AI Preferences] Error updating preferences:", error);
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

    const defaultData = {
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
    };

    const preferences = await prisma.userAIPreference.upsert({
      where: { userId },
      update: defaultData,
      create: {
        userId,
        ...defaultData
      },
    });

    res.json({
      success: true,
      data: preferences,
      message: "AI preferences reset to defaults",
    });
  } catch (error) {
    logger.error("[AI Preferences] Error resetting preferences:", error);
    res.status(500).json({
      success: false,
      message: "Failed to reset AI preferences",
    });
  }
};
