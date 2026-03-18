import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button, Input, Card } from "../ui";
import { useTheme } from "../../context";
import { BarChart2, X, Plus } from "lucide-react";
import logger from "../../utils/logger.js";

const projectSchema = z.object({
  name: z.string().min(1, "Project name is required").max(100, "Name too long"),
  description: z.string().max(500, "Description too long").optional(),
  memberIds: z.array(z.string()).optional(),
});

const CreateProjectModal = ({
  isOpen,
  onClose,
  onSubmit,
  onSave,
  loading,
  users = [],
}) => {
  const { isDark } = useTheme();
  const [selectedMembers, setSelectedMembers] = useState([]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      name: "",
      description: "",
      memberIds: [],
    },
  });

  // Handle ESC key press
  useEffect(() => {
    const handleEscapeKey = (event) => {
      if (event.key === "Escape" && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscapeKey);
    }

    return () => {
      document.removeEventListener("keydown", handleEscapeKey);
    };
  }, [isOpen, onClose]);

  const handleFormSubmit = async (data) => {
    try {
      // Prefer onSubmit if provided, otherwise fall back to onSave prop name
      const submitHandler =
        typeof onSubmit === "function"
          ? onSubmit
          : typeof onSave === "function"
            ? onSave
            : null;
      if (!submitHandler) {
        logger.warn(
          "CreateProjectModal: No submit handler provided (onSubmit/onSave). Skipping.",
        );
        return;
      }

      // Include selected members in the data
      const projectData = {
        ...data,
        memberIds: selectedMembers,
      };

      await submitHandler(projectData);
      reset();
      setSelectedMembers([]);
      onClose();
    } catch (error) {
      logger.error("Project creation failed:", error);
    }
  };

  const handleMemberToggle = (userId) => {
    setSelectedMembers((prev) => {
      const newMembers = prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId];
      setValue("memberIds", newMembers);
      return newMembers;
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 backdrop-blur-md animate-in fade-in duration-200 sm:items-center sm:p-4">
      <div
        className={`${
          isDark
            ? "bg-gray-900/90 border-gray-700/50"
            : "bg-white/90 border-gray-200/50"
        } backdrop-blur-xl border shadow-2xl max-w-lg w-full max-h-[100dvh] flex flex-col transform transition-all scale-100 rounded-t-3xl sm:max-h-[85vh] sm:rounded-2xl`}
      >
        {/* Header */}
        <div className="p-5 pb-3 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div
              className={`p-2.5 rounded-xl ${
                isDark
                  ? "bg-blue-500/10 text-blue-400"
                  : "bg-blue-50 text-blue-600"
              }`}
            >
              <BarChart2 className="w-5 h-5" />
            </div>
            <div>
              <h3
                className={`text-lg font-bold ${
                  isDark ? "text-white" : "text-gray-900"
                }`}
              >
                Create New Project
              </h3>
              <p
                className={`text-sm ${
                  isDark ? "text-gray-400" : "text-gray-500"
                }`}
              >
                Start a new workspace for your team
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`p-2 rounded-lg transition-colors ${
              isDark
                ? "text-gray-400 hover:text-white hover:bg-gray-800"
                : "text-gray-400 hover:text-gray-600 hover:bg-gray-100"
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable form body */}
        <form onSubmit={handleSubmit(handleFormSubmit)} className="flex flex-col min-h-0 flex-1">
          <div className="px-5 pb-4 space-y-4 overflow-y-auto flex-1">
            <div>
              <Input
                {...register("name")}
                label="Project Name"
                placeholder="e.g. Website Redesign Q1"
                error={errors.name?.message}
                className={isDark ? "bg-gray-800/50" : "bg-gray-50"}
              />
            </div>

            <div className="space-y-1">
              <label
                className={`block text-sm font-medium ${
                  isDark ? "text-gray-300" : "text-gray-700"
                }`}
              >
                Description
              </label>
              <textarea
                {...register("description")}
                rows={3}
                className={`w-full px-4 py-3 border rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all resize-none ${
                  isDark
                    ? "bg-gray-800/50 border-gray-600 text-white placeholder-gray-500"
                    : "bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400"
                }`}
                placeholder="What is this project about?"
              />
              {errors.description && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.description.message}
                </p>
              )}
            </div>

            {/* Member Selection */}
            {users && users.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label
                    className={`block text-sm font-medium ${
                      isDark ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
                    Team Members
                  </label>
                  {selectedMembers.length > 0 && (
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${
                        isDark
                          ? "bg-blue-500/10 text-blue-400"
                          : "bg-blue-50 text-blue-600"
                      }`}
                    >
                      {selectedMembers.length} selected
                    </span>
                  )}
                </div>
                <div
                  className={`max-h-36 overflow-y-auto border rounded-xl p-2 space-y-1 ${
                    isDark
                      ? "bg-gray-800/50 border-gray-600 custom-scrollbar-dark"
                      : "bg-gray-50 border-gray-200 custom-scrollbar"
                  }`}
                >
                  {users.map((user) => (
                    <label
                      key={user.id}
                      className={`flex items-center space-x-3 p-2 rounded-lg cursor-pointer transition-colors ${
                        isDark ? "hover:bg-gray-700/50" : "hover:bg-gray-100"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedMembers.includes(user.id)}
                        onChange={() => handleMemberToggle(user.id)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-4 h-4"
                      />
                      <div className="flex-1">
                        <p
                          className={`text-sm font-medium ${
                            isDark ? "text-gray-200" : "text-gray-700"
                          }`}
                        >
                          {user.name || user.username}
                        </p>
                        {user.email && (
                          <p
                            className={`text-xs ${
                              isDark ? "text-gray-500" : "text-gray-500"
                            }`}
                          >
                            {user.email}
                          </p>
                        )}
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Fixed footer */}
          <div className={`px-5 py-3 flex gap-3 border-t shrink-0 ${isDark ? "border-gray-700/50" : "border-gray-200/50"}`}>
            <Button type="submit" loading={loading} className="flex-1">
              Create Project
            </Button>
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateProjectModal;
