import { useTheme } from "../../context";

export const Card = ({
  children,
  className = "",
  padding = "default",
  title = "",
  ...props
}) => {
  const { isDark } = useTheme();

  const getPaddingClass = () => {
    switch (padding) {
      case "sm":
        return "p-3";
      case "lg":
        return "p-8";
      case "none":
        return "";
      default:
        return "p-6";
    }
  };

  return (
    <div
      className={`${isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"} rounded-lg shadow-md border transition-colors duration-200 ${className}`}
      {...props}
    >
      {title && (
        <div
          className={`${getPaddingClass()} border-b ${isDark ? "border-gray-700" : "border-gray-200"}`}
        >
          <h3
            className={`text-lg font-semibold ${isDark ? "text-white" : "text-gray-900"}`}
          >
            {title}
          </h3>
        </div>
      )}
      <div className={getPaddingClass()}>{children}</div>
    </div>
  );
};

export const CardHeader = ({ className = "", children, ...props }) => (
  <div className={`flex flex-col space-y-1.5 p-6 ${className}`} {...props}>
    {children}
  </div>
);

export const CardTitle = ({ className = "", children, ...props }) => {
  const { isDark } = useTheme();
  return (
    <h3
      className={`text-2xl font-semibold leading-none tracking-tight ${
        isDark ? "text-white" : "text-gray-900"
      } ${className}`}
      {...props}
    >
      {children}
    </h3>
  );
};

export const CardDescription = ({ className = "", children, ...props }) => {
  const { isDark } = useTheme();
  return (
    <p
      className={`text-sm ${
        isDark ? "text-gray-400" : "text-gray-500"
      } ${className}`}
      {...props}
    >
      {children}
    </p>
  );
};

export const CardContent = ({ className = "", children, ...props }) => (
  <div className={`p-6 pt-0 ${className}`} {...props}>
    {children}
  </div>
);

export default Card;
