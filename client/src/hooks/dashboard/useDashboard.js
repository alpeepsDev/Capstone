import { useAuth } from "../../context";
import { useNavigate } from "react-router-dom";
import { getRoleColor, getRolePermissions } from "../../utils/roleUtils.js";

export const useDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return {
    user,
    handleLogout,
    getRoleColor,
    getRolePermissions,
  };
};

export default useDashboard;
