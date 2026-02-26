import React from "react";
import { useTheme } from "../../context";

export const Skeleton = ({ className = "", ...props }) => {
  const { isDark } = useTheme();

  return (
    <div
      className={`animate-pulse rounded-md ${
        isDark ? "bg-gray-700" : "bg-gray-200"
      } ${className}`}
      {...props}
    />
  );
};

export default Skeleton;
