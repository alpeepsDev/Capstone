import { useTheme } from "../../context";

export const Input = ({
  label,
  error,
  className = "",
  type = "text",
  ...props
}) => {
  const { isDark } = useTheme();
  return (
    <div className="space-y-1">
      {label && (
        <label
          className={`block text-sm font-medium ${isDark ? "text-gray-300" : "text-gray-700"}`}
        >
          {label}
        </label>
      )}
      <input
        type={type}
        className={`block w-full rounded-md border ${isDark ? "border-gray-600 bg-gray-800 text-white" : "border-gray-300 bg-white text-gray-900"} shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 ${
          error ? "border-red-300 focus:border-red-500 focus:ring-red-500" : ""
        } ${className}`}
        {...props}
      />
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
};

export default Input;
