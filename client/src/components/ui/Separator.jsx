import React from "react";
import { useTheme } from "../../context";

export const Separator = ({
  className = "",
  orientation = "horizontal",
  ...props
}) => {
  const { isDark } = useTheme();
  return (
    <div
      className={`shrink-0 ${isDark ? "bg-gray-700" : "bg-gray-200"} ${
        orientation === "horizontal" ? "h-[1px] w-full" : "h-full w-[1px]"
      } ${className}`}
      {...props}
    />
  );
};

export default Separator;
