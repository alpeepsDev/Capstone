import React from "react";
import { useTheme } from "../../context";

export const Progress = ({ value = 0, className = "", ...props }) => {
  const { isDark } = useTheme();
  return (
    <div
      className={`relative h-4 w-full overflow-hidden rounded-full ${
        isDark ? "bg-gray-700" : "bg-gray-100"
      } ${className}`}
      {...props}
    >
      <div
        className="h-full w-full flex-1 bg-blue-600 transition-all"
        style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
      />
    </div>
  );
};

export default Progress;
