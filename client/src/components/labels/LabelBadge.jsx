import React from "react";
import { X } from "lucide-react";

const LabelBadge = ({ label, removable = false, onRemove, onClick }) => {
  const handleRemove = (e) => {
    e.stopPropagation();
    if (onRemove) {
      onRemove(label.id);
    }
  };

  const handleClick = (e) => {
    if (onClick) {
      onClick(label);
    }
  };

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
        onClick ? "cursor-pointer hover:opacity-80" : ""
      }`}
      style={{
        backgroundColor: `${label.color}20`,
        color: label.color,
        border: `1px solid ${label.color}40`,
      }}
      onClick={handleClick}
      title={label.description || label.name}
    >
      <span>{label.name}</span>
      {removable && (
        <button
          onClick={handleRemove}
          className="hover:opacity-70 transition-opacity"
          aria-label={`Remove ${label.name} label`}
        >
          <X className="w-3 h-3" />
        </button>
      )}
    </span>
  );
};

export default LabelBadge;
