import { useTheme } from "../../context";

export const Badge = ({
  children,
  variant = "default",
  size = "md",
  className = "",
}) => {
  const { isDark } = useTheme();
  const baseClasses = "inline-flex items-center font-medium rounded-full";

  const variantClasses = {
    default: isDark ? "bg-gray-700 text-gray-200" : "bg-gray-100 text-gray-800",
    primary: isDark ? "bg-blue-900 text-blue-200" : "bg-blue-100 text-blue-800",
    info: isDark ? "bg-blue-900 text-blue-200" : "bg-blue-100 text-blue-800",
    success: isDark
      ? "bg-green-900 text-green-200"
      : "bg-green-100 text-green-800",
    warning: isDark
      ? "bg-yellow-900 text-yellow-200"
      : "bg-yellow-100 text-yellow-800",
    danger: isDark ? "bg-red-900 text-red-200" : "bg-red-100 text-red-800",
  };

  const sizeClasses = {
    xs: "px-1.5 py-0.5 text-[10px]",
    sm: "px-2 py-1 text-xs",
    md: "px-2.5 py-1.5 text-sm",
    lg: "px-3 py-2 text-base",
  };

  return (
    <span
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
    >
      {children}
    </span>
  );
};

export default Badge;
