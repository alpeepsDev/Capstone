import { useState, useEffect, useCallback } from "react";

// Mock API service for users
const userAPI = {
  async fetchUsers(role = null) {
    await new Promise((resolve) => setTimeout(resolve, 300));

    const allUsers = [
      {
        id: "u1",
        username: "john_dev",
        email: "john.dev@company.com",
        role: "USER",
        status: "active",
        lastLogin: "2025-09-23T14:30:00Z",
        createdAt: "2025-08-15T09:00:00Z",
      },
      {
        id: "u2",
        username: "jane_designer",
        email: "jane@company.com",
        role: "USER",
        status: "active",
        lastLogin: "2025-09-23T13:45:00Z",
        createdAt: "2025-08-20T10:30:00Z",
      },
      {
        id: "u3",
        username: "alice_mobile",
        email: "alice@company.com",
        role: "USER",
        status: "active",
        lastLogin: "2025-09-23T12:00:00Z",
        createdAt: "2025-09-01T11:00:00Z",
      },
      {
        id: "m1",
        username: "john_manager",
        email: "john.manager@company.com",
        role: "MANAGER",
        status: "active",
        lastLogin: "2025-09-23T15:00:00Z",
        createdAt: "2025-07-10T08:00:00Z",
      },
      {
        id: "mod1",
        username: "sarah_moderator",
        email: "sarah@company.com",
        role: "MODERATOR",
        status: "active",
        lastLogin: "2025-09-23T11:30:00Z",
        createdAt: "2025-06-15T14:00:00Z",
      },
      {
        id: "admin1",
        username: "admin_user",
        email: "admin@company.com",
        role: "ADMIN",
        status: "active",
        lastLogin: "2025-09-23T16:00:00Z",
        createdAt: "2025-01-01T00:00:00Z",
      },
    ];

    return role ? allUsers.filter((user) => user.role === role) : allUsers;
  },

  async createUser(userData) {
    await new Promise((resolve) => setTimeout(resolve, 500));
    return {
      id: Date.now().toString(),
      ...userData,
      status: "active",
      createdAt: new Date().toISOString(),
      lastLogin: null,
    };
  },

  async updateUser(userId, userData) {
    await new Promise((resolve) => setTimeout(resolve, 300));
    console.log("Updating user:", userId, userData);
    return { id: userId, ...userData };
  },

  async updateUserRole(userId, newRole) {
    await new Promise((resolve) => setTimeout(resolve, 300));
    console.log("Updating user role:", userId, newRole);
    return { id: userId, role: newRole };
  },

  async deactivateUser(userId) {
    await new Promise((resolve) => setTimeout(resolve, 300));
    console.log("Deactivating user:", userId);
    return { id: userId, status: "inactive" };
  },

  async deleteUser(userId) {
    await new Promise((resolve) => setTimeout(resolve, 300));
    console.log("Deleting user:", userId);
    return { success: true };
  },
};

export const useUsers = (role = null) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const fetchedUsers = await userAPI.fetchUsers(role);
      setUsers(fetchedUsers);
    } catch (err) {
      setError(err.message);
      console.error("Failed to fetch users:", err);
    } finally {
      setLoading(false);
    }
  }, [role]);

  const createUser = async (userData) => {
    setLoading(true);
    try {
      const newUser = await userAPI.createUser(userData);
      setUsers((prev) => [...prev, newUser]);
      return newUser;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateUser = async (userId, userData) => {
    try {
      const updatedUser = await userAPI.updateUser(userId, userData);
      setUsers((prev) =>
        prev.map((user) =>
          user.id === userId ? { ...user, ...updatedUser } : user,
        ),
      );
      return updatedUser;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const updateUserRole = async (userId, newRole) => {
    try {
      const updatedUser = await userAPI.updateUserRole(userId, newRole);
      setUsers((prev) =>
        prev.map((user) =>
          user.id === userId ? { ...user, role: newRole } : user,
        ),
      );
      return updatedUser;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const deactivateUser = async (userId) => {
    try {
      await userAPI.deactivateUser(userId);
      setUsers((prev) =>
        prev.map((user) =>
          user.id === userId ? { ...user, status: "inactive" } : user,
        ),
      );
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const deleteUser = async (userId) => {
    try {
      await userAPI.deleteUser(userId);
      setUsers((prev) => prev.filter((user) => user.id !== userId));
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  // Helper functions for filtering users
  const getUsersByRole = (targetRole) => {
    return users.filter((user) => user.role === targetRole);
  };

  const getActiveUsers = () => {
    return users.filter((user) => user.status === "active");
  };

  const getUserStats = () => {
    const roleStats = users.reduce((acc, user) => {
      acc[user.role] = (acc[user.role] || 0) + 1;
      return acc;
    }, {});

    return {
      total: users.length,
      active: users.filter((u) => u.status === "active").length,
      inactive: users.filter((u) => u.status === "inactive").length,
      byRole: roleStats,
    };
  };

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  return {
    users,
    loading,
    error,
    fetchUsers,
    createUser,
    updateUser,
    updateUserRole,
    deactivateUser,
    deleteUser,
    getUsersByRole,
    getActiveUsers,
    getUserStats,
  };
};

export default useUsers;
