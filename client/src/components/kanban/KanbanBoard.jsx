import React, { useState } from "react";
import { toast, Toaster } from "react-hot-toast";
import {
  DndContext,
  DragOverlay,
  pointerWithin,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useTheme } from "../../context";
import KanbanColumn from "./KanbanColumn";
import TaskCard from "./TaskCard";
import webSocketService from "../../services/websocket.service";

const KanbanBoard = ({
  tasks,
  userRole,
  currentUserId,
  onTaskMove,
  onTaskEdit,
  onTaskDelete,
  onTaskClick,
  onAddTask,
  onRequestExchange,
  hideHeader = false, // New prop to hide the header
  projectId, // Add projectId prop
}) => {
  const [activeTask, setActiveTask] = useState(null);
  const { isDark } = useTheme();
  // Removed localTasks duplicate state - using tasks prop directly
  const [isConnected, setIsConnected] = useState(webSocketService.isConnected);

  // Subscribe to connection status changes
  React.useEffect(() => {
    const unsubscribe = webSocketService.addConnectionListener((connected) => {
      setIsConnected(connected);
    });
    return unsubscribe;
  }, []);

  // Real-time updates handled by useTasks hook now
  // Use tasks prop directly without duplication
  const safeTasks = Array.isArray(tasks) ? tasks : [];

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 0, // No distance required - immediate activation
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Define columns based on task status with consistent styling
  const columns = [
    {
      id: "PENDING",
      title: "To Do",
    },
    {
      id: "IN_PROGRESS",
      title: "In Progress",
    },
    {
      id: "DONE",
      title: "Done",
    },
    {
      id: "COMPLETED",
      title: "Completed",
    },
  ];

  // Filter tasks by status for each column
  const getTasksByStatus = (status) => {
    return safeTasks.filter((task) => {
      // Role-based filtering
      switch (userRole) {
        case "USER":
          // Users only see their own tasks
          return task.status === status && task.assigneeId === currentUserId;
        case "MANAGER":
          // Managers see all tasks in their projects
          return task.status === status;
        case "MODERATOR":
          // Moderators see all tasks for monitoring
          return task.status === status;
        case "ADMIN":
          // Admins see system overview but don't participate
          return task.status === status;
        default:
          return task.status === status;
      }
    });
  };

  const handleDragStart = (event) => {
    const { active } = event;
    const task = tasks.find((t) => t.id === active.id);
    setActiveTask(task);
  };

  const handleDragOver = (event) => {
    const { active, over } = event;
    if (!active || !over) return;

    // Enhanced visual feedback for better drop zone indication
    const columns = ["PENDING", "IN_PROGRESS", "DONE", "COMPLETED"];
    const isOverColumn = columns.includes(over.id);
    const isOverTask = !isOverColumn;

    // Add visual feedback classes for smooth animations
    if (isOverTask) {
      const overTask = safeTasks.find((t) => t.id === over.id);
      if (overTask) {
        // Tasks will slide smoothly to make space
        console.log(
          `🎯 Dragging over task: ${overTask.title} in ${overTask.status} column`
        );
      }
    } else if (isOverColumn) {
      console.log(`📁 Dragging over column: ${over.id}`);
    }
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    setActiveTask(null);

    console.log("🎯 DragEnd Event:", { active: active?.id, over: over?.id });

    if (!over || !active) {
      console.log("❌ No valid drop target");
      return;
    }

    const activeId = active.id;
    const overId = over.id;

    // Find the active task
    const activeTask = safeTasks.find((t) => t.id === activeId);
    if (!activeTask) {
      console.log("❌ Active task not found:", activeId);
      return;
    }

    const columns = ["PENDING", "IN_PROGRESS", "DONE", "COMPLETED"];
    const isColumnDrop = columns.includes(overId);

    console.log("📍 Drop Analysis:", {
      activeTask: activeTask.title,
      activeStatus: activeTask.status,
      overId,
      isColumnDrop,
      overTask: isColumnDrop
        ? null
        : safeTasks.find((t) => t.id === overId)?.title,
    });

    if (isColumnDrop) {
      // Dropping on a column - change status
      const newStatus = overId;
      console.log("📁 Column drop detected:", {
        from: activeTask.status,
        to: newStatus,
      });
      if (activeTask.status !== newStatus) {
        handleStatusChange(activeTask, newStatus);
      }
    } else {
      // Dropping on a task - either reorder or change status
      const overTask = safeTasks.find((t) => t.id === overId);

      if (!overTask) {
        console.log("❌ Over task not found:", overId);
        return;
      }

      console.log("🔄 Task-to-task drop:", {
        activeTask: activeTask.title,
        overTask: overTask.title,
        sameColumn: activeTask.status === overTask.status,
      });

      if (activeTask.status === overTask.status) {
        // Same column - reorder tasks
        console.log("Reordering in same column:", activeTask.status);

        // Get all tasks in this column
        const columnTasks = getTasksByStatus(activeTask.status);
        const oldIndex = columnTasks.findIndex((task) => task.id === activeId);
        const newIndex = columnTasks.findIndex((task) => task.id === overId);

        if (oldIndex !== newIndex && oldIndex !== -1 && newIndex !== -1) {
          // Create reordered array
          const reorderedTasks = arrayMove(columnTasks, oldIndex, newIndex);

          console.log("Tasks reordered:", {
            from: oldIndex,
            to: newIndex,
            column: activeTask.status,
            reorderedCount: reorderedTasks.length,
          });

          // Show success feedback
          toast.success("Task reordered! (Slide animation active)", {
            duration: 1500,
            icon: "🔄",
          });

          // Call onTaskReorder if provided, or just show the animation
          if (onTaskMove) {
            // For now, we'll just show the visual feedback
            // You can add actual reordering logic here if needed
            // onTaskReorder(activeId, overId, activeTask.status, reorderedTasks);
          }
        }
      } else {
        // Different column - change status to match target column
        console.log("🔀 Cross-column drop - changing status:", {
          from: activeTask.status,
          to: overTask.status,
        });
        handleStatusChange(activeTask, overTask.status);
      }
    }
  };

  const handleStatusChange = (task, newStatus) => {
    // Only restrict moving COMPLETED tasks
    const canMoveTask = () => {
      // If the task is COMPLETED, only managers can move it
      if (task.status === "COMPLETED") {
        return userRole === "MANAGER";
      }

      // All other tasks can be moved freely
      return true;
    };

    if (canMoveTask()) {
      // Special message for users moving tasks to DONE
      if (userRole === "USER" && newStatus === "DONE") {
        toast.success(
          "Task moved to Done! Your manager will review and approve when complete.",
          {
            duration: 4000,
            icon: "✅",
          }
        );
      }
      // Special message for managers approving tasks
      else if (
        userRole === "MANAGER" &&
        task.status === "DONE" &&
        newStatus === "COMPLETED"
      ) {
        toast.success("Task approved and marked as completed!", {
          duration: 3000,
          icon: "🎉",
        });
      }
      onTaskMove(task.id, newStatus);
    } else {
      // Show notification about permission
      toast.error(
        `You don't have permission to move this task to ${newStatus}`
      );
    }
  };

  const getEmptyStateMessage = () => {
    switch (userRole) {
      case "USER":
        return "No tasks assigned to you yet. Contact your manager for task assignments.";
      case "MANAGER":
        return "No tasks in this project yet. Create your first task to get started.";
      case "MODERATOR":
        return "No tasks to monitor in this project.";
      case "ADMIN":
        return "System overview - no direct task participation.";
      default:
        return "No tasks available.";
    }
  };

  return (
    <>
      <Toaster position="bottom-right" reverseOrder={false} />

      <div
        className={`${hideHeader ? "p-0" : "p-3 sm:p-4"} h-full flex flex-col overflow-hidden`}
      >
        {/* Connection Status Indicator (Debug) */}
        <div className="absolute top-2 right-2 z-50 pointer-events-none opacity-50">
          <span
            className={`inline-block w-2 h-2 rounded-full ${isConnected ? "bg-green-500" : "bg-red-500"}`}
            title={isConnected ? "Connected" : "Disconnected"}
          ></span>
        </div>
        {/* Kanban Board */}
        <DndContext
          sensors={sensors}
          collisionDetection={pointerWithin}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
          autoScroll={{
            threshold: {
              x: 0.2,
              y: 0.2,
            },
            acceleration: 10,
          }}
          measuring={{
            droppable: {
              strategy: "always",
              frequency: "optimized",
            },
            dragOverlay: {
              measure: () => ({
                width: 320,
                height: 180,
              }),
            },
          }}
        >
          {/* Mobile: Scrollable columns */}
          <div className="block lg:hidden">
            <div className="flex gap-3 overflow-x-auto pb-5 snap-x snap-mandatory scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-transparent">
              {columns.map((column) => (
                <div key={column.id} className="flex-shrink-0 w-72 snap-start">
                  <KanbanColumn
                    id={column.id}
                    title={column.title}
                    icon={column.icon}
                    color={column.color}
                    accentColor={column.accentColor}
                    tasks={getTasksByStatus(column.id)}
                    userRole={userRole}
                    currentUserId={currentUserId}
                    onTaskEdit={onTaskEdit}
                    onTaskDelete={onTaskDelete}
                    onTaskClick={onTaskClick}
                    onAddTask={onAddTask}
                    onRequestExchange={onRequestExchange}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Desktop: Enhanced grid layout */}
          <div className="hidden lg:block flex-1 h-full overflow-hidden">
            <div className="grid grid-cols-4 gap-2.5 xl:gap-3 h-full">
              {columns.map((column) => (
                <div key={column.id} className="min-w-0 h-full">
                  <KanbanColumn
                    id={column.id}
                    title={column.title}
                    icon={column.icon}
                    color={column.color}
                    accentColor={column.accentColor}
                    tasks={getTasksByStatus(column.id)}
                    userRole={userRole}
                    currentUserId={currentUserId}
                    onTaskEdit={onTaskEdit}
                    onTaskDelete={onTaskDelete}
                    onTaskClick={onTaskClick}
                    onAddTask={onAddTask}
                    onRequestExchange={onRequestExchange}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Drag Overlay */}
          <DragOverlay>
            {activeTask ? (
              <TaskCard
                task={{ ...activeTask, currentUserId }}
                userRole={userRole}
                onEdit={() => {}}
                onDelete={() => {}}
                onTaskClick={() => {}}
                onRequestExchange={() => {}}
                isOverlay
              />
            ) : null}
          </DragOverlay>
        </DndContext>

        {/* Empty State */}
        {safeTasks.length === 0 && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📋</div>
            <h3
              className={`text-xl font-medium ${isDark ? "text-white" : "text-gray-900"} mb-2`}
            >
              No Tasks Yet
            </h3>
            <p
              className={`${isDark ? "text-gray-300" : "text-gray-600"} mb-6 max-w-md mx-auto`}
            >
              {getEmptyStateMessage()}
            </p>
            {userRole === "MANAGER" && (
              <button
                onClick={() => onAddTask("PENDING")}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Create First Task
              </button>
            )}
          </div>
        )}
      </div>
    </>
  );
};

export default KanbanBoard;
