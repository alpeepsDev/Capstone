import React, { useState } from "react";
import { useTheme } from "../../context";
import { Card } from "../ui";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

const CalendarView = ({ tasks, onTaskClick }) => {
  const { isDark } = useTheme();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);

  // Get all days in the current month view
  const getCalendarDays = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    const days = [];

    // Add days from previous month
    const firstDayOfWeek = firstDay.getDay();
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      const date = new Date(year, month, -i);
      days.push({ date, isCurrentMonth: false });
    }

    // Add days of current month
    for (let i = 1; i <= lastDay.getDate(); i++) {
      const date = new Date(year, month, i);
      days.push({ date, isCurrentMonth: true });
    }

    // Add days from next month
    const remainingDays = 42 - days.length; // 6 rows * 7 days
    for (let i = 1; i <= remainingDays; i++) {
      const date = new Date(year, month + 1, i);
      days.push({ date, isCurrentMonth: false });
    }

    return days;
  };

  // Get tasks for a specific date
  const getTasksForDate = (date) => {
    if (!tasks || !Array.isArray(tasks)) return [];

    return tasks.filter((task) => {
      if (!task.dueDate) return false;
      const taskDate = new Date(task.dueDate);
      return (
        taskDate.getDate() === date.getDate() &&
        taskDate.getMonth() === date.getMonth() &&
        taskDate.getFullYear() === date.getFullYear()
      );
    });
  };

  // Navigate months
  const navigateMonth = (direction) => {
    const newDate = new Date(currentMonth);
    newDate.setMonth(newDate.getMonth() + direction);
    setCurrentMonth(newDate);
  };

  // Check if date is today
  const isToday = (date) => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  // Get task color based on priority
  const getTaskColor = (task) => {
    if (task.status === "COMPLETED" || task.status === "DONE") {
      return "bg-green-500";
    }
    switch (task.priority) {
      case "URGENT":
        return "bg-red-500";
      case "HIGH":
        return "bg-orange-500";
      case "MEDIUM":
        return "bg-blue-500";
      case "LOW":
        return "bg-purple-500";
      default:
        return "bg-gray-500";
    }
  };

  const calendarDays = getCalendarDays();
  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <Card className="overflow-hidden h-full relative" padding="none">
      <div className="flex h-full flex-col">
        {/* Header */}
        <div
          className={`border-b px-3 py-2 ${
            isDark ? "border-gray-700 bg-gray-800" : "border-gray-200 bg-white"
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => navigateMonth(-1)}
                className={`p-1 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 ${
                  isDark ? "text-gray-300" : "text-gray-600"
                }`}
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <span
                className={`text-xs font-medium min-w-[140px] text-center ${
                  isDark ? "text-gray-200" : "text-gray-700"
                }`}
              >
                {currentMonth.toLocaleDateString("en-US", {
                  month: "long",
                  year: "numeric",
                })}
              </span>
              <button
                onClick={() => navigateMonth(1)}
                className={`p-1 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 ${
                  isDark ? "text-gray-300" : "text-gray-600"
                }`}
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setCurrentMonth(new Date())}
                className="ml-2 px-2 py-1 text-[11px] bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Today
              </button>
            </div>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="flex-1 overflow-hidden p-2">
          {/* Week Day Headers */}
          <div className="grid grid-cols-7 gap-1 mb-1.5">
            {weekDays.map((day) => (
              <div
                key={day}
                className={`text-center text-[11px] font-semibold py-1 ${
                  isDark ? "text-gray-400" : "text-gray-600"
                }`}
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Days */}
          <div className="grid grid-cols-7 gap-[3px]">
            {calendarDays.map((dayObj, idx) => {
              const { date, isCurrentMonth } = dayObj;
              const dayTasks = getTasksForDate(date);
              const today = isToday(date);

              return (
                <div
                  key={idx}
                  className={`min-h-[60px] p-1.5 rounded border transition-all cursor-pointer flex flex-col ${
                    isDark
                      ? today
                        ? "bg-blue-900/20 border-blue-500"
                        : isCurrentMonth
                          ? "bg-gray-800 border-gray-700 hover:bg-gray-700"
                          : "bg-gray-900/50 border-gray-800"
                      : today
                        ? "bg-blue-50 border-blue-500"
                        : isCurrentMonth
                          ? "bg-white border-gray-200 hover:bg-gray-50"
                          : "bg-gray-50 border-gray-200"
                  }`}
                  onClick={() => {
                    setSelectedDate(date);
                  }}
                >
                  {/* Date Number */}
                  <div
                    className={`text-[11px] font-medium mb-0.5 ${
                      today
                        ? "text-blue-600 dark:text-blue-400 font-semibold"
                        : isCurrentMonth
                          ? isDark
                            ? "text-gray-200"
                            : "text-gray-900"
                          : isDark
                            ? "text-gray-600"
                            : "text-gray-400"
                    }`}
                  >
                    {date.getDate()}
                  </div>

                  {/* Tasks */}
                  <div className="space-y-[3px]">
                    {dayTasks.slice(0, 2).map((task) => (
                      <div
                        key={task.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          onTaskClick && onTaskClick(task);
                        }}
                        className={`${getTaskColor(
                          task
                        )} text-white text-[10px] px-1 py-0.5 rounded truncate hover:opacity-80 transition-opacity`}
                        title={task.title}
                      >
                        {task.title}
                      </div>
                    ))}
                    {dayTasks.length > 2 && (
                      <div
                        className={`text-[10px] px-1 ${
                          isDark ? "text-gray-400" : "text-gray-600"
                        }`}
                      >
                        +{dayTasks.length - 2} more
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Legend */}
        <div
          className={`border-t px-2 py-1.5 flex items-center gap-2 text-[10px] flex-wrap ${
            isDark
              ? "border-gray-700 bg-gray-800 text-gray-400"
              : "border-gray-200 bg-gray-50 text-gray-600"
          }`}
        >
          <span className="font-medium text-xs">Priority:</span>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded bg-red-500"></div>
            <span>Urgent</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded bg-orange-500"></div>
            <span>High</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded bg-blue-500"></div>
            <span>Medium</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded bg-purple-500"></div>
            <span>Low</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded bg-green-500"></div>
            <span>Completed</span>
          </div>
        </div>
      </div>

      {/* Date Details Modal */}
      {selectedDate && (
        <div className="absolute inset-0 z-10 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setSelectedDate(null)}
          />
          <div
            className={`relative w-full max-w-sm rounded-lg shadow-xl overflow-hidden flex flex-col max-h-[80%] ${
              isDark
                ? "bg-gray-800 border border-gray-700"
                : "bg-white border border-gray-200"
            }`}
          >
            <div
              className={`flex items-center justify-between p-3 border-b ${
                isDark ? "border-gray-700" : "border-gray-200"
              }`}
            >
              <h3
                className={`font-semibold ${isDark ? "text-white" : "text-gray-900"}`}
              >
                {selectedDate.toLocaleDateString("en-US", {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                })}
              </h3>
              <button
                onClick={() => setSelectedDate(null)}
                className={`p-1 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 ${
                  isDark ? "text-gray-400" : "text-gray-500"
                }`}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 overflow-y-auto">
              {getTasksForDate(selectedDate).length > 0 ? (
                <div className="space-y-2">
                  {getTasksForDate(selectedDate).map((task) => (
                    <div
                      key={task.id}
                      onClick={() => {
                        onTaskClick && onTaskClick(task);
                        setSelectedDate(null);
                      }}
                      className={`p-2 rounded border cursor-pointer transition-colors ${
                        isDark
                          ? "bg-gray-700/50 border-gray-600 hover:bg-gray-700"
                          : "bg-gray-50 border-gray-200 hover:bg-gray-100"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span
                          className={`text-sm font-medium ${isDark ? "text-gray-200" : "text-gray-900"}`}
                        >
                          {task.title}
                        </span>
                        <span
                          className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                            task.priority === "URGENT"
                              ? "bg-red-100 text-red-700"
                              : task.priority === "HIGH"
                                ? "bg-orange-100 text-orange-700"
                                : task.priority === "MEDIUM"
                                  ? "bg-blue-100 text-blue-700"
                                  : "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {task.priority}
                        </span>
                      </div>
                      {task.description && (
                        <p
                          className={`text-xs mt-1 line-clamp-2 ${isDark ? "text-gray-400" : "text-gray-500"}`}
                        >
                          {task.description}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div
                  className={`text-center py-8 ${isDark ? "text-gray-500" : "text-gray-400"}`}
                >
                  <p>No tasks for this date</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </Card>
  );
};

export default CalendarView;
