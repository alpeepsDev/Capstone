import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import prisma from "../config/database.js";
import { hash } from "../utils/hashing.js";
import { encrypt } from "../utils/encryption.js";

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
      throw new Error("User with this username or email already exists");
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
        emailHash: hash(email),
        usernameHash: hash(username),
      },
      select: {
        id: true,
        username: true,
        email: true,
        name: true,
        role: true,
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
      throw new Error("Invalid credentials");
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      throw new Error("Invalid credentials");
    }

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    });

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
        throw new Error("Invalid token type");
      }

      // Get user from database (auto-decrypted by middleware)
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: {
          id: true,
          username: true,
          name: true,
          role: true,
        },
      });

      if (!user) {
        throw new Error("User not found");
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
      throw new Error("Invalid refresh token");
    }
  },

  async getUserById(userId) {
    return await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        name: true,
        role: true,
        createdAt: true,
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
    return await prisma.user.update({
      where: { id: userId },
      data: { avatar: avatarPath },
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
