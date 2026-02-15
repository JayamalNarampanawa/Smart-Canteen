import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { User } from "../models/User.js";
import { ROLES } from "../constants/roles.js";
import { env } from "../config/env.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { createHttpError } from "../utils/httpError.js";
import { requireAuth } from "../middleware/auth.js";

const router = express.Router();

function signToken(user) {
  return jwt.sign({ userId: user._id.toString(), role: user.role }, env.jwtSecret, {
    expiresIn: "7d"
  });
}

router.post(
  "/register",
  asyncHandler(async (req, res) => {
    const { name, email, password, studentId, phone } = req.body;
    if (!name || !email || !password) {
      throw createHttpError(400, "name, email and password are required");
    }

    const existing = await User.findOne({ email: email.toLowerCase() }).lean();
    if (existing) {
      throw createHttpError(409, "Email already exists");
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({
      name,
      email,
      passwordHash,
      role: ROLES.USER,
      studentId: studentId || null,
      phone: phone || null
    });

    const token = signToken(user);
    return res.status(201).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        studentId: user.studentId,
        phone: user.phone
      }
    });
  })
);

router.post(
  "/login",
  asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
      throw createHttpError(400, "email and password are required");
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user || !user.isActive) {
      throw createHttpError(401, "Invalid credentials");
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      throw createHttpError(401, "Invalid credentials");
    }

    const token = signToken(user);
    return res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        studentId: user.studentId,
        phone: user.phone
      }
    });
  })
);

router.get(
  "/me",
  requireAuth,
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.auth.userId).select("-passwordHash").lean();
    if (!user) {
      throw createHttpError(404, "User not found");
    }
    return res.json({ user });
  })
);

export default router;

