import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import prisma from "../config/database.js";
import { hash } from "../utils/hashing.js";
import { encrypt } from "../utils/encryption.js";
import AppError from "../utils/AppError.js";
import logger from "../utils/logger.js";

export const userService = {
  async createUser(userData) {
    const { username, email, password, name, role = "USER" } = userData;

    // Check if user already exists (username or email) via deterministic hashes
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ usernameHash: hash(username) }, { emailHash: hash(email) }],
      },
    });

    if (existingUser) {
      throw new AppError("User with this username or email already exists", {
        status: 409,
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user with encrypted PII and deterministic hashes for lookups
    // Note: PII fields are auto-decrypted by Prisma middleware on return
    return await prisma.user.create({
      data: {
        username: encrypt(username),
        email: encrypt(email),
        password: hashedPassword,
        name: encrypt(name),
        role,
        avatar: `https://api.dicebear.com/9.x/avataaars/svg?seed=${username}`,
        emailHash: hash(email),
        usernameHash: hash(username),
      },
      select: {
        id: true,
        username: true,
        email: true,
        name: true,
        role: true,
        avatar: true,
        createdAt: true,
      },
    });
  },

  async authenticateUser(email, password) {
    // Find user by deterministic email hash
    // Note: user PII fields are auto-decrypted by Prisma middleware
    const user = await prisma.user.findUnique({
      where: { emailHash: hash(email) },
    });

    if (!user) {
      throw new AppError("Invalid credentials", { status: 401 });
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      throw new AppError("Invalid credentials", { status: 401 });
    }

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    });

    if (user.mfaEnabled) {
      // Generate a 6-digit OTP
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const otpHash = await bcrypt.hash(otp, 10);

      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + 10);

      await prisma.user.update({
        where: { id: user.id },
        data: {
          mfaOtp: otpHash,
          mfaOtpExpires: expiresAt,
        },
      });

      const { sendMfaEmail } = await import("../utils/email.js");
      await sendMfaEmail(email, otp);

      return {
        mfaRequired: true,
        email: email,
        message: "MFA verification code sent to your email",
      };
    }

    // Generate JWT access token (short-lived)
    const accessToken = jwt.sign(
      {
        userId: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }, // 1 hour
    );

    // Generate refresh token (long-lived)
    const refreshToken = jwt.sign(
      { userId: user.id, type: "refresh" },
      process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }, // 7 days
    );

    return {
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        name: user.name,
        role: user.role,
        avatar: user.avatar,
        mfaEnabled: user.mfaEnabled,
      },
      accessToken,
      refreshToken,
    };
  },

  async refreshToken(refreshToken) {
    try {
      // Verify refresh token
      const decoded = jwt.verify(
        refreshToken,
        process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
      );

      if (decoded.type !== "refresh") {
        throw new AppError("Invalid refresh token", { status: 401 });
      }

      // Get user from database (auto-decrypted by middleware)
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: {
          id: true,
          username: true,
          name: true,
          role: true,
          avatar: true,
        },
      });

      if (!user) {
        throw new AppError("User not found", { status: 401 });
      }

      // Generate new access token
      const accessToken = jwt.sign(
        { userId: user.id, username: user.username, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: "15m" },
      );

      return {
        user,
        accessToken,
      };
    } catch (error) {
      if (
        error?.name?.includes("Prisma") ||
        error?.message?.includes("fetch failed")
      ) {
        logger.error(
          "[Auth] Refresh token failed due to database connectivity",
          {
            message: error?.message,
            name: error?.name,
            stack: error?.stack,
          },
        );
        throw new AppError(
          "Service temporarily unavailable. Please try again.",
          {
            status: 503,
          },
        );
      }

      throw new AppError("Invalid refresh token", { status: 401 });
    }
  },

  async verifyMfaOtp(email, otp) {
    // Find user by deterministic email hash
    const user = await prisma.user.findUnique({
      where: { emailHash: hash(email) },
    });

    if (!user) {
      throw new AppError("Invalid request", { status: 400 });
    }

    if (!user.mfaOtp || !user.mfaOtpExpires) {
      throw new AppError("Invalid or expired MFA code", { status: 400 });
    }

    if (new Date() > user.mfaOtpExpires) {
      throw new AppError("MFA code has expired", { status: 400 });
    }

    // Verify OTP matches hash
    const isOtpValid = await bcrypt.compare(otp, user.mfaOtp);
    if (!isOtpValid) {
      throw new AppError("Invalid MFA code", { status: 400 });
    }

    // Clear OTP fields
    await prisma.user.update({
      where: { id: user.id },
      data: {
        mfaOtp: null,
        mfaOtpExpires: null,
      },
    });

    // Generate tokens
    const accessToken = jwt.sign(
      {
        userId: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    const refreshToken = jwt.sign(
      { userId: user.id, type: "refresh" },
      process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    return {
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        name: user.name,
        role: user.role,
        avatar: user.avatar,
        mfaEnabled: user.mfaEnabled,
      },
      accessToken,
      refreshToken,
    };
  },

  async toggleMfa(userId, enable) {
    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        mfaEnabled: enable,
        mfaOtp: null,
        mfaOtpExpires: null,
      },
      select: {
        id: true,
        mfaEnabled: true,
      },
    });
    return user;
  },

  async forgotPassword(email) {
    // Find user by deterministic email hash
    const user = await prisma.user.findUnique({
      where: { emailHash: hash(email) },
    });

    if (!user) {
      // Return true anyway to prevent email enumeration attacks
      return true;
    }

    // Generate a 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Hash the OTP before saving it to DB
    const otpHash = await bcrypt.hash(otp, 10);

    // Set expiration to 15 minutes from now
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 15);

    // Update user record
    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetPasswordOtp: otpHash,
        resetPasswordExpires: expiresAt,
      },
    });

    // Send the email
    const { sendPasswordResetEmail } = await import("../utils/email.js");
    await sendPasswordResetEmail(email, otp);

    return true;
  },

  async resetPassword(email, otp, newPassword) {
    // Find user by deterministic email hash
    const user = await prisma.user.findUnique({
      where: { emailHash: hash(email) },
    });

    if (!user) {
      throw new AppError("Invalid request", { status: 400 });
    }

    // Verify OTP exists and hasn't expired
    if (!user.resetPasswordOtp || !user.resetPasswordExpires) {
      throw new AppError("Invalid or expired reset code", { status: 400 });
    }

    if (new Date() > user.resetPasswordExpires) {
      throw new AppError("Reset code has expired", { status: 400 });
    }

    // Verify OTP matches hash
    const isOtpValid = await bcrypt.compare(otp, user.resetPasswordOtp);
    if (!isOtpValid) {
      throw new AppError("Invalid reset code", { status: 400 });
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // Update user and clear OTP fields
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetPasswordOtp: null,
        resetPasswordExpires: null,
      },
    });

    return true;
  },

  async getUserById(userId) {
    return await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        email: true,
        name: true,
        role: true,
        avatar: true,
        createdAt: true,
        mfaEnabled: true,
      },
    });
  },

  async updateUserRole(userId, newRole) {
    return await prisma.user.update({
      where: { id: userId },
      data: { role: newRole },
      select: {
        id: true,
        username: true,
        email: true,
        name: true,
        role: true,
      },
    });
  },

  async updateAvatar(userId, avatarPath) {
    // Normalize path separators to forward slashes for URL compatibility
    const normalizedPath = avatarPath.replace(/\\/g, "/");
    return await prisma.user.update({
      where: { id: userId },
      data: { avatar: normalizedPath },
      select: {
        id: true,
        username: true,
        email: true,
        name: true,
        role: true,
        avatar: true,
      },
    });
  },

  async getAllUsers() {
    return await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        email: true,
        name: true,
        role: true,
        avatar: true,
        isActive: true,
        createdAt: true,
        lastLogin: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  },
};
