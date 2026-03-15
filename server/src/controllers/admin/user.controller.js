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

    const user = await userService.updateAvatar(req.user.id, req.file.path);

    res.json({
      success: true,
      message: "Avatar uploaded successfully",
      data: user,
    });
  }),

  getAllUsers: asyncHandler(async (req, res) => {
    const users = await userService.getAllUsers();

    res.json({
      success: true,
      data: users,
    });
  }),

  forgotPassword: asyncHandler(async (req, res) => {
    const { email } = req.body;

    await userService.forgotPassword(email);

    res.json({
      success: true,
      message:
        "If an account with that email exists, a password reset link has been sent.",
    });
  }),

  resetPassword: asyncHandler(async (req, res) => {
    const { email, otp, newPassword } = req.body;

    await userService.resetPassword(email, otp, newPassword);

    res.json({
      success: true,
      message: "Password has been reset successfully. You can now log in.",
    });
  }),
  logout: asyncHandler(async (req, res) => {
    // In a stateful system, we would invalidate the refresh token in the DB here.
    // Since we are currently stateless, we just return success to signal client-side cleanup.
    res.json({
      success: true,
      message: "Logged out successfully",
    });
  }),
};
