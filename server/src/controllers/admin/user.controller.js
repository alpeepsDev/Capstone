import { userService } from "../../services/user.service.js";
import { asyncHandler } from "../../utils/asyncHandler.js";

export const userController = {
  register: asyncHandler(async (req, res) => {
    const { username, email, password, name, role } = req.body;

    const user = await userService.createUser({
      username,
      email,
      password,
      name,
      role,
    });

    res.status(201).json({
      success: true,
      message: "User created successfully",
      data: user,
    });
  }),

  login: asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    const result = await userService.authenticateUser(email, password);

    res.json({
      success: true,
      message: "Login successful",
      data: result,
    });
  }),

  refreshToken: asyncHandler(async (req, res) => {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        message: "Refresh token is required",
      });
    }

    const result = await userService.refreshToken(refreshToken);

    res.json({
      success: true,
      message: "Token refreshed successfully",
      data: result,
    });
  }),

  getProfile: asyncHandler(async (req, res) => {
    const user = await userService.getUserById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.json({
      success: true,
      data: user,
    });
  }),

  updateRole: asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const { role } = req.body;

    // Check if current user has permission to update roles (only ADMIN)
    if (req.user.role !== "ADMIN") {
      return res.status(403).json({
        success: false,
        message: "Access denied. Only administrators can update user roles.",
      });
    }

    const user = await userService.updateUserRole(userId, role);

    res.json({
      success: true,
      message: "User role updated successfully",
      data: user,
    });
  }),

  uploadAvatar: asyncHandler(async (req, res) => {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded",
      });
    }

    // Normalize path separators to forward slashes for URL compatibility
    const avatarPath = req.file.path.replace(/\\/g, "/");

    const user = await userService.updateAvatar(req.user.id, avatarPath);

    res.json({
      success: true,
      message: "Avatar uploaded successfully",
      data: user,
    });
  }),

  getAllUsers: asyncHandler(async (req, res) => {
    // Only admins, moderators, and managers can view all users
    if (!["ADMIN", "MODERATOR", "MANAGER"].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    const users = await userService.getAllUsers();

    res.json({
      success: true,
      data: users,
    });
  }),
};
