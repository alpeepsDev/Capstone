import React from "react";
import { useTheme } from "../../context";

export const Slider = ({
  value = [0],
  min = 0,
  max = 100,
  step = 1,
  onValueChange,
  className = "",
  ...props
}) => {
  const { isDark } = useTheme();

  const handleChange = (e) => {
    if (onValueChange) {
      onValueChange([parseFloat(e.target.value)]);
    }
  };

  return (
    <div
      className={`relative flex w-full touch-none select-none items-center ${className}`}
    >
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value[0]}
        onChange={handleChange}
        className={`w-full h-2 rounded-lg appearance-none cursor-pointer ${
          isDark ? "bg-gray-700" : "bg-gray-200"
        } accent-blue-600`}
        {...props}
      />
    </div>
  );
};

export default Slider;
