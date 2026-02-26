import React, { useState, useEffect } from "react";
import { Plus, Edit2, Trash2, Tag } from "lucide-react";
import axios from "axios";
import { useTheme } from "../context";
import { toast } from "react-hot-toast";
import LabelBadge from "../components/labels/LabelBadge";
import { authService } from "../api/auth";

const LabelManagement = () => {
  const { isDark } = useTheme();
  const [labels, setLabels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingLabel, setEditingLabel] = useState(null);

  const [formData, setFormData] = useState({
    name: "",
    color: "#3b82f6",
    description: "",
    isGlobal: false,
  });

  const colorPresets = [
    "#ef4444", // red
    "#f59e0b", // amber
    "#10b981", // green
    "#3b82f6", // blue
    "#8b5cf6", // purple
    "#ec4899", // pink
    "#6b7280", // gray
  ];

  useEffect(() => {
    fetchLabels();
  }, []);

  const fetchLabels = async () => {
    try {
      setLoading(true);
      const token = authService.getAccessToken();
      const response = await axios.get(
        `http://localhost:3001/api/v1/labels?includeGlobal=true`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      // Ensure we always set an array
      const labelsData = Array.isArray(response.data)
        ? response.data
        : Array.isArray(response.data?.data)
          ? response.data.data
          : [];
      setLabels(labelsData);
    } catch (error) {
      console.error("Error fetching labels:", error);
      toast.error("Failed to fetch labels");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const token = authService.getAccessToken();

      if (editingLabel) {
        // Update
        await axios.put(
          `http://localhost:3001/api/v1/labels/${editingLabel.id}`,
          formData,
          { headers: { Authorization: `Bearer ${token}` } },
        );
        toast.success("Label updated");
      } else {
        // Create
        await axios.post(`http://localhost:3001/api/v1/labels`, formData, {
          headers: { Authorization: `Bearer ${token}` },
        });
        toast.success("Label created");
      }

      fetchLabels();
      setShowCreateForm(false);
      setEditingLabel(null);
      setFormData({
        name: "",
        color: "#3b82f6",
        description: "",
        isGlobal: false,
      });
    } catch (error) {
      console.error("Error saving label:", error);
      toast.error(error.response?.data?.error || "Failed to save label");
    }
  };

  const handleEdit = (label) => {
    setEditingLabel(label);
    setFormData({
      name: label.name,
      color: label.color,
      description: label.description || "",
      isGlobal: label.isGlobal,
    });
    setShowCreateForm(true);
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this label? It will be removed from all tasks."))
      return;

    try {
      const token = authService.getAccessToken();
      await axios.delete(`http://localhost:3001/api/v1/labels/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Label deleted");
      fetchLabels();
    } catch (error) {
      console.error("Error deleting label:", error);
      toast.error("Failed to delete label");
    }
  };

  return (
    <div
      className={`min-h-screen p-6 ${isDark ? "bg-gray-900" : "bg-gray-50"}`}
    >
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1
              className={`text-3xl font-bold ${isDark ? "text-white" : "text-gray-900"}`}
            >
              Label Management
            </h1>
            <p className={`mt-2 ${isDark ? "text-gray-400" : "text-gray-600"}`}>
              Create and manage labels for organizing tasks
            </p>
          </div>

          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
              isDark
                ? "bg-blue-600 hover:bg-blue-700 text-white"
                : "bg-blue-500 hover:bg-blue-600 text-white"
            } transition-colors`}
          >
            <Plus className="w-5 h-5" />
            Create Label
          </button>
        </div>

        {/* Create/Edit Form */}
        {showCreateForm && (
          <div
            className={`rounded-lg border p-6 mb-6 ${
              isDark
                ? "bg-gray-800 border-gray-700"
                : "bg-white border-gray-200"
            }`}
          >
            <h2
              className={`text-xl font-semibold mb-4 ${isDark ? "text-white" : "text-gray-900"}`}
            >
              {editingLabel ? "Edit Label" : "Create New Label"}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label
                  className={`block text-sm font-medium mb-2 ${isDark ? "text-gray-300" : "text-gray-700"}`}
                >
                  Label Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className={`w-full px-3 py-2 rounded-lg border ${
                    isDark
                      ? "bg-gray-700 border-gray-600 text-white"
                      : "bg-white border-gray-300 text-gray-900"
                  }`}
                  required
                  placeholder="e.g., Bug Fix, Frontend, Urgent"
                />
              </div>

              <div>
                <label
                  className={`block text-sm font-medium mb-2 ${isDark ? "text-gray-300" : "text-gray-700"}`}
                >
                  Color *
                </label>
                <div className="flex gap-2 items-center">
                  {colorPresets.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setFormData({ ...formData, color })}
                      className={`w-10 h-10 rounded-lg border-2 transition-all ${
                        formData.color === color
                          ? "border-gray-900 dark:border-white scale-110"
                          : "border-transparent"
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                  <input
                    type="color"
                    value={formData.color}
                    onChange={(e) =>
                      setFormData({ ...formData, color: e.target.value })
                    }
                    className="w-10 h-10 rounded-lg border"
                  />
                </div>
              </div>

              <div>
                <label
                  className={`block text-sm font-medium mb-2 ${isDark ? "text-gray-300" : "text-gray-700"}`}
                >
                  Description (Optional)
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className={`w-full px-3 py-2 rounded-lg border ${
                    isDark
                      ? "bg-gray-700 border-gray-600 text-white"
                      : "bg-white border-gray-300 text-gray-900"
                  }`}
                  rows={2}
                  placeholder="Brief description of this label's purpose"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isGlobal"
                  checked={formData.isGlobal}
                  onChange={(e) =>
                    setFormData({ ...formData, isGlobal: e.target.checked })
                  }
                  className="rounded"
                />
                <label
                  htmlFor="isGlobal"
                  className={`text-sm ${isDark ? "text-gray-300" : "text-gray-700"}`}
                >
                  Global label (usable across all projects)
                </label>
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  {editingLabel ? "Update" : "Create"} Label
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateForm(false);
                    setEditingLabel(null);
                    setFormData({
                      name: "",
                      color: "#3b82f6",
                      description: "",
                      isGlobal: false,
                    });
                  }}
                  className={`px-4 py-2 rounded-lg ${
                    isDark
                      ? "bg-gray-700 text-gray-300"
                      : "bg-gray-200 text-gray-700"
                  }`}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Labels List */}
        <div
          className={`rounded-lg border ${isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}
        >
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto" />
            </div>
          ) : labels.length === 0 ? (
            <div className="p-8 text-center">
              <Tag
                className={`w-12 h-12 mx-auto mb-4 ${isDark ? "text-gray-600" : "text-gray-400"}`}
              />
              <p className={isDark ? "text-gray-400" : "text-gray-600"}>
                No labels yet. Create your first label to get started.
              </p>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr
                  className={`border-b ${isDark ? "border-gray-700" : "border-gray-200"}`}
                >
                  <th
                    className={`text-left p-4 font-medium ${isDark ? "text-gray-300" : "text-gray-700"}`}
                  >
                    Label
                  </th>
                  <th
                    className={`text-left p-4 font-medium ${isDark ? "text-gray-300" : "text-gray-700"}`}
                  >
                    Description
                  </th>
                  <th
                    className={`text-left p-4 font-medium ${isDark ? "text-gray-300" : "text-gray-700"}`}
                  >
                    Scope
                  </th>
                  <th
                    className={`text-left p-4 font-medium ${isDark ? "text-gray-300" : "text-gray-700"}`}
                  >
                    Usage
                  </th>
                  <th
                    className={`text-right p-4 font-medium ${isDark ? "text-gray-300" : "text-gray-700"}`}
                  >
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {labels.map((label) => (
                  <tr
                    key={label.id}
                    className={`border-b ${isDark ? "border-gray-700" : "border-gray-200"}`}
                  >
                    <td className="p-4">
                      <LabelBadge label={label} />
                    </td>
                    <td
                      className={`p-4 text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}
                    >
                      {label.description || "-"}
                    </td>
                    <td className="p-4">
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          label.isGlobal
                            ? isDark
                              ? "bg-purple-900/30 text-purple-400"
                              : "bg-purple-100 text-purple-700"
                            : isDark
                              ? "bg-gray-700 text-gray-400"
                              : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {label.isGlobal ? "Global" : "Project"}
                      </span>
                    </td>
                    <td
                      className={`p-4 text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}
                    >
                      {label._count?.tasks || 0} tasks
                    </td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => handleEdit(label)}
                        className={`p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors`}
                        title="Edit label"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(label.id)}
                        className={`p-2 rounded hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 transition-colors`}
                        title="Delete label"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default LabelManagement;
