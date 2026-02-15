import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { User } from "../models/User.js";
import { createHttpError } from "../utils/httpError.js";

export async function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization || "";
  const [scheme, token] = authHeader.split(" ");

  if (scheme !== "Bearer" || !token) {
    return next(createHttpError(401, "Unauthorized"));
  }

  try {
    const payload = jwt.verify(token, env.jwtSecret);
    const user = await User.findById(payload.userId).lean();

    if (!user || !user.isActive) {
      return next(createHttpError(401, "Invalid or inactive user"));
    }

    req.auth = {
      userId: user._id.toString(),
      role: user.role
    };

    return next();
  } catch (error) {
    return next(createHttpError(401, "Invalid token"));
  }
}

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.auth || !roles.includes(req.auth.role)) {
      return next(createHttpError(403, "Forbidden"));
    }
    return next();
  };
}

