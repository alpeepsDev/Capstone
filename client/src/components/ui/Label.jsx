import React from "react";
import { useTheme } from "../../context";

export const Label = ({ className = "", children, ...props }) => {
  const { isDark } = useTheme();
  return (
    <label
      className={`text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 ${
        isDark ? "text-white" : "text-gray-900"
      } ${className}`}
      {...props}
    >
      {children}
    </label>
  );
};

export default Label;
