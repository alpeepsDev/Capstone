import { useState, useEffect } from "react";
import { useTheme } from "../../context";
import { X, Settings, User, Globe } from "lucide-react";
import Button from "../ui/Button";

const RateLimitConfigModal = ({
  isOpen,
  onClose,
  type, // 'role', 'user', or 'endpoint'
  onSave,
  initialData = null,
  users = [], // For user selection
  endpoints = [],
}) => {
  const { isDark } = useTheme();
  const [formData, setFormData] = useState({
    role: "USER",
    userId: "",
    endpoint: "",
    method: "GET",
    limit: 200,
    window: 3600,
  });

  useEffect(() => {
    if (initialData) {
      setFormData((prev) => ({
        ...prev,
        ...initialData,
      }));
    } else {
      // Reset form when modal opens
      setFormData({
        role: "USER",
        userId: "",
        endpoint: "",
        method: "GET",
        limit: type === "role" ? 100 : 200,
        window: type === "role" ? 1 : 3600,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialData, isOpen, type]);

  const handleSubmit = (e) => {
    e.preventDefault();
    // Default to 1 if empty or invalid
    const limit =
      !formData.limit || isNaN(formData.limit) || formData.limit < 1
        ? 1
        : formData.limit;
    const windowVal =
      !formData.window || isNaN(formData.window) || formData.window < 1
        ? 1
        : formData.window;
    onSave({ ...formData, limit, window: windowVal });
  };

  if (!isOpen) return null;

  const getTitle = () => {
    switch (type) {
      case "role":
        return "Configure Per-Role Rate Limit";
      case "user":
        return "Set User-Specific Rate Limit";
      case "endpoint":
        return "Configure Endpoint Throttling";
      default:
        return "Configure Rate Limit";
    }
  };

  const getIcon = () => {
    switch (type) {
      case "role":
        return <Settings className="w-5 h-5" />;
      case "user":
        return <User className="w-5 h-5" />;
      case "endpoint":
        return <Globe className="w-5 h-5" />;
      default:
        return <Settings className="w-5 h-5" />;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div
        className={`${
          isDark
            ? "bg-white/6 text-white backdrop-filter backdrop-blur-lg"
            : "bg-white/60 text-gray-900 backdrop-filter backdrop-blur-lg"
        } border border-white/10 rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto`}
      >
        {/* Header */}
        <div
          className={`flex items-center justify-between p-4 border-b ${
            isDark ? "border-gray-700" : "border-gray-200"
          }`}
        >
          <div className="flex items-center gap-2">
            <div className="text-blue-500">{getIcon()}</div>
            <h2 className="text-xl font-semibold">{getTitle()}</h2>
          </div>
          <button
            onClick={onClose}
            className={`p-2 rounded-lg ${
              isDark
                ? "hover:bg-gray-700 text-gray-400"
                : "hover:bg-gray-100 text-gray-600"
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Role Selection (for role type) */}
          {type === "role" && (
            <div>
              <label
                className={`block text-sm font-medium mb-1 ${
                  isDark ? "text-gray-300" : "text-gray-700"
                }`}
              >
                User Role
              </label>
              <select
                value={formData.role}
                onChange={(e) =>
                  setFormData({ ...formData, role: e.target.value })
                }
                className={`w-full px-3 py-2 border rounded-lg ${
                  isDark
                    ? "bg-gray-700 border-gray-600 text-white"
                    : "bg-white border-gray-300 text-gray-900"
                } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                required
                disabled={type === "role"}
              >
                <option value="USER">USER</option>
                <option value="MANAGER">MANAGER</option>
                <option value="ADMIN">ADMIN</option>
              </select>
            </div>
          )}

          {type === "role" && (
            <div className="rounded-lg p-4 bg-blue-50 text-blue-900 dark:bg-blue-900/40 dark:text-blue-100 border border-blue-200 dark:border-blue-800 space-y-2">
              <p className="text-sm font-medium">
                Global rate limiting enforces a hard cap of 100 requests per second for every role.
                Editing per-role limits is disabled while this global policy is active.
              </p>
              <div className="flex gap-4 text-sm">
                <span className="font-semibold">Limit: 100/s</span>
                <span className="font-semibold">Window: 1s</span>
              </div>
            </div>
          )}

          {/* User Selection (for user type) */}
          {type === "user" && (
            <div>
              <label
                className={`block text-sm font-medium mb-1 ${
                  isDark ? "text-gray-300" : "text-gray-700"
                }`}
              >
                Select User
              </label>
              <select
                value={formData.userId}
                onChange={(e) =>
                  setFormData({ ...formData, userId: e.target.value })
                }
                className={`w-full px-3 py-2 border rounded-lg ${
                  isDark
                    ? "bg-gray-700 border-gray-600 text-white"
                    : "bg-white border-gray-300 text-gray-900"
                } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                required
              >
                <option value="">-- Select a user --</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.username} ({user.email}) - {user.role}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Endpoint Configuration (for endpoint type) */}
          {type === "endpoint" && (
            <>
              <div>
                <label
                  className={`block text-sm font-medium mb-1 ${
                    isDark ? "text-gray-300" : "text-gray-700"
                  }`}
                >
                  API Endpoint
                </label>
                {endpoints && endpoints.length > 0 ? (
                  <select
                    value={formData.endpoint}
                    onChange={(e) =>
                      setFormData({ ...formData, endpoint: e.target.value })
                    }
                    className={`w-full px-3 py-2 border rounded-lg ${
                      isDark
                        ? "bg-gray-700 border-gray-600 text-white"
                        : "bg-white border-gray-300 text-gray-900"
                    } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                    required
                  >
                    <option value="">-- Select endpoint --</option>
                    {endpoints.map((ep, idx) => (
                      <option key={idx} value={ep.endpoint}>
                        {ep.methods} {ep.endpoint}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    value={formData.endpoint}
                    onChange={(e) =>
                      setFormData({ ...formData, endpoint: e.target.value })
                    }
                    placeholder="/api/v1/tasks"
                    className={`w-full px-3 py-2 border rounded-lg ${
                      isDark
                        ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                        : "bg-white border-gray-300 text-gray-900 placeholder-gray-500"
                    } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                    required
                  />
                )}
              </div>

              <div>
                <label
                  className={`block text-sm font-medium mb-1 ${
                    isDark ? "text-gray-300" : "text-gray-700"
                  }`}
                >
                  HTTP Method
                </label>
                <select
                  value={formData.method}
                  onChange={(e) =>
                    setFormData({ ...formData, method: e.target.value })
                  }
                  className={`w-full px-3 py-2 border rounded-lg ${
                    isDark
                      ? "bg-gray-700 border-gray-600 text-white"
                      : "bg-white border-gray-300 text-gray-900"
                  } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                  required
                >
                  <option value="*">* (All Methods)</option>
                  <option value="GET">GET</option>
                  <option value="POST">POST</option>
                  <option value="PUT">PUT</option>
                  <option value="PATCH">PATCH</option>
                  <option value="DELETE">DELETE</option>
                </select>
              </div>
            </>
          )}

          {/* Limit - Hidden for role type, shown for others */}
          {type !== "role" && (
            <div>
              <label
                className={`block text-sm font-medium mb-1 ${
                  isDark ? "text-gray-300" : "text-gray-700"
                }`}
              >
                Request Limit
              </label>
              <input
                type="number"
                value={formData.limit === 0 ? "" : formData.limit}
                onChange={(e) => {
                  const val = e.target.value;
                  setFormData({
                    ...formData,
                    limit: val === "" ? "" : parseInt(val),
                  });
                }}
                min="1"
                className={`w-full px-3 py-2 border rounded-lg ${
                  isDark
                    ? "bg-gray-700 border-gray-600 text-white"
                    : "bg-white border-gray-300 text-gray-900"
                } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                required
              />
              <p
                className={`text-xs mt-1 ${
                  isDark ? "text-gray-400" : "text-gray-600"
                }`}
              >
                Maximum number of requests allowed per time window
              </p>
            </div>
          )}

          {/* Time Window - Hidden for role type, shown for others */}
          {type !== "role" && (
            <div>
              <label
                className={`block text-sm font-medium mb-1 ${
                  isDark ? "text-gray-300" : "text-gray-700"
                }`}
              >
                Time Window (seconds)
              </label>
              <input
                type="number"
                value={formData.window === 0 ? "" : formData.window}
                onChange={(e) => {
                  const val = e.target.value;
                  setFormData({
                    ...formData,
                    window: val === "" ? "" : parseInt(val),
                  });
                }}
                min="1"
                className={`w-full px-3 py-2 border rounded-lg ${
                  isDark
                    ? "bg-gray-700 border-gray-600 text-white"
                    : "bg-white border-gray-300 text-gray-900"
                } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                required
              />
              <p
                className={`text-xs mt-1 ${
                  isDark ? "text-gray-400" : "text-gray-600"
                }`}
              >
                {type === "endpoint"
                  ? "Common: 60 (1 min), 300 (5 min)"
                  : "Common: 3600 (1 hour), 86400 (24 hours)"}
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" className="flex-1">
              {initialData ? "Update" : "Create"} Configuration
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RateLimitConfigModal;
