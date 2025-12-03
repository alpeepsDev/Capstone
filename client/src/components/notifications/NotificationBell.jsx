import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme, useNotifications } from "../../context";
import {
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
} from "../../api/notifications";
import { toast } from "react-hot-toast";

const NotificationBell = () => {
  const navigate = useNavigate();
  const { isDark } = useTheme();
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    removeNotification,
    connectionStatus,
  } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Handle mark as read
  const handleMarkAsRead = async (notificationId) => {
    try {
      await markNotificationAsRead(notificationId);
      markAsRead(notificationId);
    } catch (error) {
      toast.error("Failed to mark notification as read");
    }
  };

  // Handle mark all as read
  const handleMarkAllAsRead = async () => {
    try {
      await markAllNotificationsAsRead();
      markAllAsRead();
      toast.success("All notifications marked as read");
    } catch (error) {
      toast.error("Failed to mark all notifications as read");
    }
  };

  // Handle delete notification
  const handleDelete = async (notificationId) => {
    try {
      await deleteNotification(notificationId);
      removeNotification(notificationId);
      toast.success("Notification deleted");
    } catch (error) {
      toast.error("Failed to delete notification");
    }
  };

  // Handle notification click
  const handleNotificationClick = async (notification) => {
    // Mark as read if unread
    if (!notification.isRead) {
      handleMarkAsRead(notification.id);
    }

    // Close dropdown
    setIsOpen(false);

    // Navigate to task if applicable
    if (notification.taskId && notification.projectId) {
      navigate(
        `/dashboard?projectId=${notification.projectId}&taskId=${notification.taskId}`
      );
    }
  };

  // Format time ago
  const formatTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 60) return "Just now";
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400)
      return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  };

  // Get notification icon based on type
  const getNotificationIcon = (type) => {
    switch (type) {
      case "TASK_CHANGES_REQUESTED":
        return "⚠️";
      case "TASK_UPDATED":
        return "📝";
      case "TASK_ASSIGNED":
        return "📋";
      case "TASK_COMPLETED":
        return "✅";
      case "TASK_APPROVED":
        return "👍";
      default:
        return "🔔";
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Notification Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`relative p-2 rounded-lg transition-colors ${
          isDark
            ? "text-gray-300 hover:text-white hover:bg-gray-800"
            : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
        }`}
      >
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 17h5l-5 5v-5zM10 17H5l5 5v-5zM12 2C8.686 2 6 4.686 6 8c0 1.657-.343 3.165-.943 4.57-.6 1.405-1.395 2.675-2.314 3.765A1 1 0 004 18h16a1 1 0 001.257-1.665c-.919-1.09-1.714-2.36-2.314-3.765C18.343 11.165 18 9.657 18 8c0-3.314-2.686-6-6-6z"
          />
        </svg>

        {/* Unread count badge */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-red-600 rounded-full">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Dropdown */}
      {isOpen && (
        <div
          className={`absolute right-0 mt-2 w-80 rounded-md shadow-lg z-50 ${
            isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
          } border`}
        >
          {/* Header */}
          <div
            className={`px-4 py-3 border-b ${isDark ? "border-gray-700" : "border-gray-200"}`}
          >
            <div className="flex items-center justify-between">
              <h3
                className={`text-lg font-semibold ${isDark ? "text-white" : "text-gray-900"}`}
              >
                Notifications
              </h3>
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                >
                  Mark all read
                </button>
              )}
            </div>
          </div>

          {/* Notifications List */}
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="px-4 py-6 text-center">
                <p
                  className={`text-sm ${isDark ? "text-gray-400" : "text-gray-500"}`}
                >
                  No notifications yet
                </p>
              </div>
            ) : (
              notifications.slice(0, 10).map((notification) => (
                <div
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={`px-4 py-3 border-b last:border-b-0 transition-colors cursor-pointer ${
                    isDark ? "border-gray-700" : "border-gray-100"
                  } ${
                    !notification.isRead
                      ? isDark
                        ? "bg-blue-900/20"
                        : "bg-blue-50"
                      : ""
                  } hover:${isDark ? "bg-gray-700" : "bg-gray-50"}`}
                >
                  <div className="flex items-start space-x-3">
                    <span className="text-lg flex-shrink-0 mt-0.5">
                      {getNotificationIcon(notification.type)}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p
                            className={`text-sm font-medium ${isDark ? "text-white" : "text-gray-900"}`}
                          >
                            {notification.title}
                          </p>
                          <p
                            className={`text-sm mt-1 ${isDark ? "text-gray-300" : "text-gray-600"}`}
                          >
                            {notification.message}
                          </p>
                          <p
                            className={`text-xs mt-1 ${isDark ? "text-gray-400" : "text-gray-500"}`}
                          >
                            {formatTimeAgo(notification.createdAt)}
                          </p>
                        </div>
                        <div
                          className="flex items-center space-x-1 ml-2"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {!notification.isRead && (
                            <button
                              onClick={() => handleMarkAsRead(notification.id)}
                              className="p-1 text-blue-600 hover:text-blue-800"
                              title="Mark as read"
                            >
                              <svg
                                className="w-4 h-4"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                  clipRule="evenodd"
                                />
                              </svg>
                            </button>
                          )}
                          <button
                            onClick={() => handleDelete(notification.id)}
                            className={`p-1 ${isDark ? "text-gray-400 hover:text-red-400" : "text-gray-500 hover:text-red-600"}`}
                            title="Delete"
                          >
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                              />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          {notifications.length > 10 && (
            <div
              className={`px-4 py-3 border-t ${isDark ? "border-gray-700" : "border-gray-200"}`}
            >
              <button
                onClick={() => setIsOpen(false)}
                className="w-full text-center text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                View all notifications
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
