import React, { useEffect, useRef } from "react";
import Gantt from "frappe-gantt";
import { useTheme } from "../../context";
import { Card } from "../ui";

// Import CSS from the actual file path
import "../../styles/frappe-gantt.css";

const GanttChart = ({ tasks, onTaskClick, onDateChange }) => {
  const { isDark } = useTheme();
  const ganttRef = useRef(null);
  const ganttInstance = useRef(null);

  useEffect(() => {
    if (!ganttRef.current || !tasks || tasks.length === 0) return;

    // Transform tasks to Frappe Gantt format
    const ganttTasks = tasks
      .filter((task) => task.dueDate) // Only show tasks with dates
      .map((task) => {
        // Use createdAt as start if no explicit startDate
        const start = task.startDate
          ? new Date(task.startDate)
          : new Date(task.createdAt);
        const end = new Date(task.dueDate);

        // Ensure end is after start
        if (end <= start) {
          end.setTime(start.getTime() + 24 * 60 * 60 * 1000); // Add 1 day
        }

        return {
          id: task.id,
          name: task.title,
          start: start.toISOString().split("T")[0],
          end: end.toISOString().split("T")[0],
          progress:
            task.status === "COMPLETED"
              ? 100
              : task.status === "IN_REVIEW"
                ? 90
                : task.status === "IN_PROGRESS"
                  ? 50
                  : 0,
          custom_class: `priority-${task.priority?.toLowerCase()} status-${task.status?.toLowerCase()}`,
        };
      });

    if (ganttTasks.length === 0) return;

    // Clean up existing instance
    if (ganttInstance.current) {
      ganttInstance.current = null;
    }

    // Clear the container
    ganttRef.current.innerHTML = "";

    // Create new Gantt instance
    try {
      ganttInstance.current = new Gantt(ganttRef.current, ganttTasks, {
        view_mode: "Day",
        bar_height: 30,
        bar_corner_radius: 3,
        arrow_curve: 5,
        padding: 18,
        view_modes: ["Quarter Day", "Half Day", "Day", "Week", "Month"],
        date_format: "YYYY-MM-DD",
        language: "en",
        on_click: (task) => {
          if (onTaskClick) {
            const originalTask = tasks.find((t) => t.id === task.id);
            onTaskClick(originalTask);
          }
        },
        on_date_change: (task, start, end) => {
          if (onDateChange) {
            onDateChange(task.id, {
              startDate: start,
              dueDate: end,
            });
          }
        },
        on_progress_change: (task, progress) => {
          console.log("Progress changed:", task.id, progress);
        },
      });
    } catch (error) {
      console.error("Error creating Gantt chart:", error);
    }

    return () => {
      if (ganttInstance.current) {
        ganttInstance.current = null;
      }
    };
  }, [tasks, onTaskClick, onDateChange]);

  const tasksWithDates = tasks?.filter((task) => task.dueDate) || [];

  if (tasksWithDates.length === 0) {
    return (
      <Card>
        <div className="text-center py-12">
          <div className="text-3xl mb-2">📊</div>
          <p
            className={`${isDark ? "text-gray-300" : "text-gray-600"} text-sm`}
          >
            No tasks with due dates to display in Gantt chart.
          </p>
          <p
            className={`${isDark ? "text-gray-400" : "text-gray-500"} text-xs mt-2`}
          >
            Add due dates to your tasks to see them here.
          </p>
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <div
        className={`gantt-container ${isDark ? "gantt-dark" : "gantt-light"}`}
      >
        <div ref={ganttRef} className="gantt-chart-wrapper"></div>
      </div>

      {/* Custom styles */}
      <style jsx>{`
        .gantt-container {
          overflow-x: auto;
          padding: 1rem;
        }

        .gantt-chart-wrapper {
          min-height: 400px;
        }

        /* Priority colors */
        :global(.priority-urgent .bar) {
          fill: #ef4444 !important;
        }
        :global(.priority-high .bar) {
          fill: #f97316 !important;
        }
        :global(.priority-medium .bar) {
          fill: #3b82f6 !important;
        }
        :global(.priority-low .bar) {
          fill: #8b5cf6 !important;
        }

        /* Status colors for completed */
        :global(.status-completed .bar) {
          fill: #22c55e !important;
        }
        :global(.status-cancelled .bar) {
          fill: #6b7280 !important;
        }

        /* Dark mode styles */
        .gantt-dark :global(.gantt .grid-background) {
          fill: #1f2937;
        }
        .gantt-dark :global(.gantt .grid-row) {
          fill: transparent;
        }
        .gantt-dark :global(.gantt .grid-header) {
          fill: #111827;
        }
        .gantt-dark :global(.gantt .tick) {
          stroke: #374151;
        }
        .gantt-dark :global(.gantt .tick.thick) {
          stroke: #4b5563;
        }
        .gantt-dark :global(.gantt .today-highlight) {
          fill: rgba(59, 130, 246, 0.1);
        }
        .gantt-dark :global(.gantt text) {
          fill: #e5e7eb;
        }

        /* Light mode styles */
        .gantt-light :global(.gantt .grid-background) {
          fill: #ffffff;
        }
        .gantt-light :global(.gantt .grid-header) {
          fill: #f9fafb;
        }
        .gantt-light :global(.gantt .tick) {
          stroke: #e5e7eb;
        }
        .gantt-light :global(.gantt .tick.thick) {
          stroke: #d1d5db;
        }
        .gantt-light :global(.gantt .today-highlight) {
          fill: rgba(59, 130, 246, 0.05);
        }
        .gantt-light :global(.gantt text) {
          fill: #374151;
        }

        /* Bar progress */
        :global(.gantt .bar-progress) {
          fill: #4ade80;
        }

        /* Hover effects */
        :global(.gantt .bar:hover) {
          opacity: 0.9;
        }
      `}</style>
    </Card>
  );
};

export default GanttChart;
