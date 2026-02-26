import { useState } from "react";

/**
 * Custom hook for managing modal states across dashboard components
 * Provides a consistent interface for opening/closing various modals
 * Reusable across User, Manager, and Admin dashboards
 */
export const useModalState = () => {
  const [taskDetailOpen, setTaskDetailOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [exchangeModalOpen, setExchangeModalOpen] = useState(false);
  const [createTaskOpen, setCreateTaskOpen] = useState(false);

  const openTaskDetail = (task) => {
    setSelectedTask(task);
    setTaskDetailOpen(true);
  };

  const closeTaskDetail = () => {
    setTaskDetailOpen(false);
    setSelectedTask(null);
  };

  const openExchangeModal = (task) => {
    setSelectedTask(task);
    setExchangeModalOpen(true);
  };

  const closeExchangeModal = () => {
    setExchangeModalOpen(false);
    setSelectedTask(null);
  };

  const openCreateTask = () => {
    setCreateTaskOpen(true);
  };

  const closeCreateTask = () => {
    setCreateTaskOpen(false);
  };

  return {
    // Task detail modal
    taskDetailOpen,
    selectedTask,
    openTaskDetail,
    closeTaskDetail,

    // Exchange modal
    exchangeModalOpen,
    openExchangeModal,
    closeExchangeModal,

    // Create task modal
    createTaskOpen,
    openCreateTask,
    closeCreateTask,
  };
};
