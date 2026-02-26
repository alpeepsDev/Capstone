import jwt from "jsonwebtoken";
import { userService } from "../services/user.service.js";

/**
 * Optional Authentication Middleware
 * Attempts to authenticate the user but does not block the request if authentication fails.
 * This is useful for global middleware like rate limiting that needs to know *who* the user is
 * if they are logged in, but shouldn't prevent access to public routes.
 */
export const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
      return next();
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // We try to get the user, but if it fails (e.g. user deleted), we just continue as guest
    const user = await userService.getUserById(decoded.userId);

    if (user) {
      req.user = user;
    }

    next();
  } catch (error) {
    // If token is invalid or expired, just continue as guest
    next();
  }
};
