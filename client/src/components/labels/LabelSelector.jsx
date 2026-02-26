import React, { useState, useEffect, useRef } from "react";
import { X, Plus, Tag } from "lucide-react";
import axios from "axios";
import { useTheme } from "../../context";
import LabelBadge from "./LabelBadge";
import { authService } from "../../api/auth";

const LabelSelector = ({
  taskId,
  projectId,
  selectedLabels = [],
  onChange,
}) => {
  const { isDark } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [availableLabels, setAvailableLabels] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);

  // Fetch available labels
  useEffect(() => {
    const fetchLabels = async () => {
      try {
        const token = authService.getAccessToken();
        const params = new URLSearchParams();

        if (projectId) {
          params.append("projectId", projectId);
        }
        params.append("includeGlobal", "true");

        const response = await axios.get(
          `${import.meta.env.VITE_API_URL}/api/v1/labels?${params}`,
          { headers: { Authorization: `Bearer ${token}` } },
        );

        // Ensure we always set an array
        const labels = Array.isArray(response.data)
          ? response.data
          : Array.isArray(response.data?.data)
            ? response.data.data
            : [];
        console.log("📋 Fetched labels:", labels);
        console.log("📋 Response structure:", response.data);
        setAvailableLabels(labels);
      } catch (error) {
        console.error("Error fetching labels:", error);
      }
    };

    if (isOpen) {
      fetchLabels();
    }
  }, [isOpen, projectId]);

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

  const handleAddLabel = async (labelId) => {
    if (!taskId) {
      // If no taskId, just update local state (for create task modal)
      const label = (
        Array.isArray(availableLabels) ? availableLabels : []
      ).find((l) => l.id === labelId);
      if (label) {
        onChange([...selectedLabels, label]);
      }
      return;
    }

    try {
      setLoading(true);
      const token = authService.getAccessToken();

      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/v1/labels/task/${taskId}`,
        { labelId },
        { headers: { Authorization: `Bearer ${token}` } },
      );

      const label = response.data.label;
      onChange([...selectedLabels, label]);
      setSearchQuery("");
    } catch (error) {
      console.error("Error adding label:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveLabel = async (labelId) => {
    if (!taskId) {
      // If no taskId, just update local state (for create task modal)
      onChange(
        selectedLabels.filter((l) => {
          const labelData = l?.label || l;
          return labelData?.id !== labelId;
        }),
      );
      return;
    }

    try {
      setLoading(true);
      const token = authService.getAccessToken();

      await axios.delete(
        `${import.meta.env.VITE_API_URL}/api/v1/labels/task/${taskId}/${labelId}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );

      onChange(
        selectedLabels.filter((l) => {
          const labelData = l?.label || l;
          return labelData?.id !== labelId;
        }),
      );
    } catch (error) {
      console.error("Error removing label:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredLabels = (
    Array.isArray(availableLabels) ? availableLabels : []
  ).filter((label) => {
    if (!selectedLabels || selectedLabels.length === 0) return true;

    const isAlreadySelected = selectedLabels.some((selected) => {
      const selectedLabelData = selected?.label || selected;
      return selectedLabelData?.id === label.id;
    });

    return (
      !isAlreadySelected &&
      label.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  return (
    <div className="relative" ref={dropdownRef}>
      <div
        className={`flex flex-wrap gap-2 items-center ${isDark ? "text-white" : "text-gray-900"}`}
      >
        {selectedLabels &&
          selectedLabels.length > 0 &&
          selectedLabels.map((label) => {
            // Handle both nested (taskLabel.label) and direct label objects
            const labelData = label?.label || label;
            if (!labelData || !labelData.id) return null;

            return (
              <LabelBadge
                key={labelData.id}
                label={labelData}
                removable={!loading}
                onRemove={handleRemoveLabel}
              />
            );
          })}

        <button
          onClick={() => setIsOpen(!isOpen)}
          disabled={loading}
          className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs ${
            isDark
              ? "bg-gray-700 hover:bg-gray-600 text-gray-300"
              : "bg-gray-200 hover:bg-gray-300 text-gray-700"
          } transition-colors disabled:opacity-50`}
        >
          <Plus className="w-3 h-3" />
          Add Label
        </button>
      </div>

      {isOpen && (
        <div
          className={`absolute z-50 mt-2 w-64 rounded-lg shadow-lg ${
            isDark
              ? "bg-gray-800 border border-gray-700"
              : "bg-white border border-gray-200"
          }`}
        >
          <div className="p-2">
            <input
              type="text"
              placeholder="Search labels..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full px-3 py-2 rounded text-sm ${
                isDark
                  ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                  : "bg-gray-100 border-gray-300 text-gray-900 placeholder-gray-500"
              } border focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
              autoFocus
            />
          </div>

          <div className="max-h-60 overflow-y-auto">
            {filteredLabels.length === 0 ? (
              <div
                className={`px-4 py-3 text-sm ${isDark ? "text-gray-400" : "text-gray-500"}`}
              >
                {searchQuery ? "No labels found" : "No more labels available"}
              </div>
            ) : (
              filteredLabels.map((label) => (
                <button
                  key={label.id}
                  onClick={() => handleAddLabel(label.id)}
                  disabled={loading}
                  className={`w-full px-4 py-2 text-left flex items-center gap-2 ${
                    isDark
                      ? "hover:bg-gray-700 text-white"
                      : "hover:bg-gray-100 text-gray-900"
                  } transition-colors disabled:opacity-50`}
                >
                  <Tag className="w-4 h-4" style={{ color: label.color }} />
                  <span className="text-sm">{label.name}</span>
                  {label.isGlobal && (
                    <span
                      className={`ml-auto text-xs ${isDark ? "text-gray-400" : "text-gray-500"}`}
                    >
                      Global
                    </span>
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default LabelSelector;
