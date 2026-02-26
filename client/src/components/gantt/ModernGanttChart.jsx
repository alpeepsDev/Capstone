import React, { useState } from "react";
import { useTheme } from "../../context";
import { Card, Skeleton } from "../ui";
import { ChevronLeft, ChevronRight, Calendar, User } from "lucide-react";

const ModernGanttChart = ({ tasks, onTaskClick, loading }) => {
  const { isDark } = useTheme();
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Filter tasks with dates
  const tasksWithDates = tasks?.filter((task) => task.dueDate) || [];

  // Get date range for current view
  const getDateRange = () => {
    const start = new Date(currentMonth);
    start.setDate(1);
    start.setDate(start.getDate() - start.getDay()); // Start from Sunday

    const end = new Date(currentMonth);
    end.setMonth(end.getMonth() + 1);
    end.setDate(0);
    end.setDate(end.getDate() + (6 - end.getDay())); // End on Saturday

    const days = [];
    const current = new Date(start);
    while (current <= end) {
      days.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }

    return days;
  };

  const dateRange = getDateRange();

  // Navigate months
  const navigateMonth = (direction) => {
    const newDate = new Date(currentMonth);
    newDate.setMonth(newDate.getMonth() + direction);
    setCurrentMonth(newDate);
  };

  // Calculate task position and width
  const getTaskStyle = (task) => {
    const startDate = task.startDate
      ? new Date(task.startDate)
      : new Date(task.createdAt);
    const endDate = new Date(task.dueDate);

    const firstDay = dateRange[0];

    const startOffset = Math.max(
      0,
      Math.floor((startDate - firstDay) / (1000 * 60 * 60 * 24)),
    );
    const endOffset = Math.min(
      dateRange.length - 1,
      Math.floor((endDate - firstDay) / (1000 * 60 * 60 * 24)),
    );

    const width = ((endOffset - startOffset + 1) / dateRange.length) * 100;
    const left = (startOffset / dateRange.length) * 100;

    return { left: `${left}%`, width: `${width}%` };
  };

  // Get task color based on priority and status
  const getTaskColor = (task) => {
    if (task.status === "COMPLETED" || task.status === "IN_REVIEW") {
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

  // Format date for display
  const formatDate = (date) => {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
    }).format(date);
  };

  return (
    <Card className="overflow-hidden">
      {/* Header */}
      <div
        className={`border-b p-3 ${
          isDark ? "border-gray-700 bg-gray-800" : "border-gray-200 bg-white"
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2
              className={`text-lg font-semibold ${
                isDark ? "text-white" : "text-gray-900"
              }`}
            >
              Gantt Chart
            </h2>
            <div className="flex items-center gap-1">
              <button
                onClick={() => navigateMonth(-1)}
                className={`p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700`}
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span
                className={`text-sm font-medium px-2 ${
                  isDark ? "text-gray-300" : "text-gray-700"
                }`}
              >
                {currentMonth.toLocaleDateString("en-US", {
                  month: "long",
                  year: "numeric",
                })}
              </span>
              <button
                onClick={() => navigateMonth(1)}
                className={`p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700`}
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
          <button
            onClick={() => setCurrentMonth(new Date())}
            className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-1"
          >
            <Calendar className="w-3 h-3" />
            Today
          </button>
        </div>
      </div>

      {/* Timeline */}
      <div className="overflow-x-auto">
        <div className="min-w-[1000px]">
          {/* Date Headers */}
          <div
            className={`grid border-b ${
              isDark
                ? "border-gray-700 bg-gray-800"
                : "border-gray-200 bg-gray-50"
            }`}
            style={{ gridTemplateColumns: `150px 1fr` }}
          >
            <div
              className={`p-2 border-r text-xs font-medium ${
                isDark
                  ? "border-gray-700 text-gray-300"
                  : "border-gray-200 text-gray-700"
              }`}
            >
              Tasks
            </div>
            <div
              className="grid"
              style={{
                gridTemplateColumns: `repeat(${dateRange.length}, 1fr)`,
              }}
            >
              {dateRange.map((date, idx) => {
                const isToday =
                  date.toDateString() === new Date().toDateString();
                const isWeekend = date.getDay() === 0 || date.getDay() === 6;
                return (
                  <div
                    key={idx}
                    className={`p-1 text-center text-[10px] border-r ${
                      isDark ? "border-gray-700" : "border-gray-200"
                    } ${
                      isToday
                        ? "bg-blue-500 text-white"
                        : isWeekend
                          ? isDark
                            ? "bg-gray-700 text-gray-400"
                            : "bg-gray-100 text-gray-500"
                          : isDark
                            ? "text-gray-400"
                            : "text-gray-600"
                    }`}
                  >
                    <div className="font-medium">{date.getDate()}</div>
                    <div className="text-[8px]">
                      {date.toLocaleDateString("en-US", { weekday: "short" })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Tasks */}
          {loading ? (
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {[1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className="grid border-b border-gray-200 dark:border-gray-700"
                  style={{ gridTemplateColumns: `150px 1fr` }}
                >
                  <div className="p-2 border-r border-gray-200 dark:border-gray-700 flex items-center gap-2">
                    <Skeleton className="w-1.5 h-1.5 rounded-full" />
                    <div className="flex-1">
                      <Skeleton className="h-3 w-3/4 mb-1 rounded" />
                      <Skeleton className="h-2 w-1/2 rounded" />
                    </div>
                  </div>
                  <div className="relative h-12 flex items-center px-4">
                    {/* Random width and position skeletons for realistic feel */}
                    <Skeleton
                      className="h-6 rounded"
                      style={{
                        width: `${Math.floor(Math.random() * 30 + 10)}%`,
                        marginLeft: `${Math.floor(Math.random() * 50)}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : tasksWithDates.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-2xl mb-2">📊</div>
              <p
                className={`${
                  isDark ? "text-gray-300" : "text-gray-600"
                } text-sm`}
              >
                No tasks with due dates to display.
              </p>
              <p
                className={`${
                  isDark ? "text-gray-400" : "text-gray-500"
                } text-xs mt-1`}
              >
                Add due dates to your tasks to see them here.
              </p>
            </div>
          ) : (
            <div>
              {tasksWithDates.map((task) => {
                const taskStyle = getTaskStyle(task);
                const taskColor = getTaskColor(task);
                const startDate = task.startDate
                  ? new Date(task.startDate)
                  : new Date(task.createdAt);
                const endDate = new Date(task.dueDate);

                return (
                  <div
                    key={task.id}
                    className={`grid border-b ${
                      isDark ? "border-gray-700" : "border-gray-200"
                    } hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors`}
                    style={{ gridTemplateColumns: `150px 1fr` }}
                  >
                    {/* Task Name */}
                    <div
                      className={`p-2 border-r flex items-center gap-2 ${
                        isDark ? "border-gray-700" : "border-gray-200"
                      }`}
                    >
                      <div
                        className={`w-1.5 h-1.5 rounded-full ${taskColor}`}
                      ></div>
                      <div className="flex-1 min-w-0">
                        <div
                          className={`text-xs font-medium truncate ${
                            isDark ? "text-gray-200" : "text-gray-900"
                          }`}
                        >
                          {task.title}
                        </div>
                        {task.assignee && (
                          <div
                            className={`text-[10px] flex items-center gap-1 ${
                              isDark ? "text-gray-400" : "text-gray-500"
                            }`}
                          >
                            <User className="w-2.5 h-2.5" />
                            {task.assignee.name || task.assignee.username}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Task Bar */}
                    <div className="relative h-12 flex items-center">
                      {/* Grid lines */}
                      <div
                        className="absolute inset-0 grid"
                        style={{
                          gridTemplateColumns: `repeat(${dateRange.length}, 1fr)`,
                        }}
                      >
                        {dateRange.map((date, idx) => (
                          <div
                            key={idx}
                            className={`border-r ${
                              isDark ? "border-gray-700" : "border-gray-200"
                            }`}
                          ></div>
                        ))}
                      </div>

                      {/* Task bar */}
                      <div
                        className="absolute top-1/2 -translate-y-1/2 h-6 group cursor-pointer"
                        style={taskStyle}
                        onClick={() => onTaskClick && onTaskClick(task)}
                      >
                        <div
                          className={`h-full ${taskColor} rounded flex items-center justify-between px-2 text-white text-[10px] font-medium shadow-md hover:shadow-lg transition-all group-hover:scale-105`}
                        >
                          <span className="truncate flex-1">{task.title}</span>
                          {task.assignee && (
                            <div className="flex -space-x-1 ml-1">
                              <div className="w-4 h-4 rounded-full bg-white text-gray-900 flex items-center justify-center text-[8px] font-bold border border-white">
                                {(task.assignee.name || task.assignee.username)
                                  .charAt(0)
                                  .toUpperCase()}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Edit period tooltip */}
                        <div className="absolute -top-7 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20">
                          <div className="bg-gray-900 text-white text-[10px] px-2 py-1 rounded whitespace-nowrap">
                            {formatDate(startDate)} - {formatDate(endDate)}
                          </div>
                        </div>
                      </div>

                      {/* Today marker */}
                      {(() => {
                        const today = new Date();
                        const todayOffset = Math.floor(
                          (today - dateRange[0]) / (1000 * 60 * 60 * 24),
                        );
                        if (
                          todayOffset >= 0 &&
                          todayOffset < dateRange.length
                        ) {
                          return (
                            <div
                              className="absolute top-0 bottom-0 w-0.5 bg-blue-500 z-10"
                              style={{
                                left: `${(todayOffset / dateRange.length) * 100}%`,
                              }}
                            >
                              <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-2 h-2 bg-blue-500 rounded-full"></div>
                            </div>
                          );
                        }
                        return null;
                      })()}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Legend */}
      <div
        className={`border-t p-2 flex items-center gap-3 text-[10px] flex-wrap ${
          isDark
            ? "border-gray-700 bg-gray-800 text-gray-400"
            : "border-gray-200 bg-gray-50 text-gray-600"
        }`}
      >
        <span className="font-medium text-xs">Priority:</span>
        <div className="flex items-center gap-1">
          <div className="w-2.5 h-2.5 rounded bg-red-500"></div>
          <span>Urgent</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2.5 h-2.5 rounded bg-orange-500"></div>
          <span>High</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2.5 h-2.5 rounded bg-blue-500"></div>
          <span>Medium</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2.5 h-2.5 rounded bg-purple-500"></div>
          <span>Low</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2.5 h-2.5 rounded bg-green-500"></div>
          <span>Completed</span>
        </div>
      </div>
    </Card>
  );
};

export default ModernGanttChart;
