export const getRoleColor = (role) => {
  switch (role) {
    case "ADMIN":
      return "bg-red-100 text-red-800";
    case "MANAGER":
      return "bg-purple-100 text-purple-800";
    default:
      return "bg-blue-100 text-blue-800";
  }
};

export const getRolePermissions = (role) => {
  switch (role) {
    case "ADMIN":
      return [
        "Full system access",
        "User management",
        "System configuration",
        "All project access",
      ];
    case "MANAGER":
      return [
        "Project management",
        "Team oversight",
        "Resource allocation",
        "Reporting",
      ];
    default:
      return ["Task creation", "Project participation", "Progress tracking"];
  }
};
