import React, { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import { getAIPreferences, updateAIPreferences } from "../../api/aiPreferences";
import { Loader2 } from "lucide-react";

/**
 * AI Preferences Settings Component
 * Allows users to toggle AI features like Auto-Escalation
 */
const AIPreferencesSettings = ({ isDark }) => {
  const [loading, setLoading] = useState(true);
  const [prefs, setPrefs] = useState({
    enableAutoEscalation: true,
    enableProactiveNotifs: true,
    deadlineWarningDays: [1, 3, 7], // Default warning days
  });

  useEffect(() => {
    fetchPreferences();
  }, []);

  const fetchPreferences = async () => {
    try {
      const response = await getAIPreferences();
      setPrefs(response.data);
    } catch (error) {
      console.error("Failed to fetch preferences:", error);
      toast.error("Could not load AI preferences");
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (key) => {
    // Optimistic update
    const newValue = !prefs[key];
    const oldPrefs = { ...prefs };

    setPrefs((prev) => ({
      ...prev,
      [key]: newValue,
    }));

    try {
      await updateAIPreferences({ [key]: newValue });
      toast.success("Preference updated");
    } catch (error) {
      console.error("Failed to update preference:", error);
      toast.error("Failed to save changes");
      // Revert on error
      setPrefs(oldPrefs);
    }
  };

  const handleDayToggle = async (day) => {
    const currentDays = prefs.deadlineWarningDays || [];
    const newDays = currentDays.includes(day)
      ? currentDays.filter((d) => d !== day) // Remove day
      : [...currentDays, day].sort((a, b) => a - b); // Add day and sort

    const oldPrefs = { ...prefs };
    setPrefs((prev) => ({
      ...prev,
      deadlineWarningDays: newDays,
    }));

    try {
      await updateAIPreferences({ deadlineWarningDays: newDays });
      toast.success("Deadline warnings updated");
    } catch (error) {
      console.error("Failed to update deadline warnings:", error);
      toast.error("Failed to save changes");
      setPrefs(oldPrefs);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center p-4">
        <Loader2 className="animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h4
            className={`font-medium ${
              isDark ? "text-gray-100" : "text-gray-900"
            }`}
          >
            Auto-Escalation (Risk Response)
          </h4>
          <p
            className={`text-sm ${
              isDark ? "text-gray-400" : "text-gray-600"
            } mt-1`}
          >
            Automatically increase priority of overdue tasks and notify
            managers.
          </p>
        </div>
        <ToggleSwitch
          checked={prefs.enableAutoEscalation}
          onChange={() => handleToggle("enableAutoEscalation")}
          isDark={isDark}
        />
      </div>

      <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="mb-4">
          <h4
            className={`font-medium ${
              isDark ? "text-gray-100" : "text-gray-900"
            }`}
          >
            Deadline Warning Days
          </h4>
          <p
            className={`text-sm ${
              isDark ? "text-gray-400" : "text-gray-600"
            } mt-1`}
          >
            Choose how many days before a deadline you want to be notified.
          </p>
        </div>

        <div className="grid grid-cols-7 gap-2">
          {[1, 2, 3, 4, 5, 6, 7, 10, 14].map((day) => (
            <button
              key={day}
              onClick={() => handleDayToggle(day)}
              className={`
                px-3 py-2 rounded-lg text-sm font-medium transition-all
                ${
                  (prefs.deadlineWarningDays || []).includes(day)
                    ? isDark
                      ? "bg-blue-600 text-white border-2 border-blue-500"
                      : "bg-blue-500 text-white border-2 border-blue-600"
                    : isDark
                      ? "bg-gray-700 text-gray-300 border-2 border-gray-600 hover:bg-gray-600"
                      : "bg-gray-100 text-gray-700 border-2 border-gray-300 hover:bg-gray-200"
                }
              `}
            >
              {day}d
            </button>
          ))}
        </div>

        {prefs.deadlineWarningDays && prefs.deadlineWarningDays.length > 0 && (
          <p
            className={`text-xs mt-3 ${
              isDark ? "text-gray-500" : "text-gray-500"
            }`}
          >
            You'll receive warnings{" "}
            <span className="font-semibold">
              {prefs.deadlineWarningDays.join(", ")}
            </span>{" "}
            day{prefs.deadlineWarningDays.length > 1 ? "s" : ""} before
            deadlines.
          </p>
        )}
      </div>
    </div>
  );
};

const ToggleSwitch = ({ checked, onChange, isDark }) => (
  <button
    onClick={onChange}
    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
      checked ? "bg-blue-600" : isDark ? "bg-gray-600" : "bg-gray-200"
    }`}
  >
    <span
      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
        checked ? "translate-x-6" : "translate-x-1"
      }`}
    />
  </button>
);

export default AIPreferencesSettings;
