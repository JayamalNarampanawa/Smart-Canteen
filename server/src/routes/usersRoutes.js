import express from "express";
import bcrypt from "bcryptjs";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { ROLES } from "../constants/roles.js";
import { User } from "../models/User.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { createHttpError } from "../utils/httpError.js";

const router = express.Router();

router.use(requireAuth, requireRole(ROLES.SUPER_ADMIN));

router.get(
  "/canteen-admins",
  asyncHandler(async (req, res) => {
    const users = await User.find({ role: ROLES.CANTEEN_ADMIN }).select("-passwordHash").sort({ createdAt: -1 }).lean();
    res.json({ users });
  })
);

router.post(
  "/canteen-admins",
  asyncHandler(async (req, res) => {
    const { name, email, password, phone } = req.body;
    if (!name || !email || !password) {
      throw createHttpError(400, "name, email and password are required");
    }

    const existing = await User.findOne({ email: email.toLowerCase() }).lean();
    if (existing) throw createHttpError(409, "Email already exists");

    const user = await User.create({
      name,
      email,
      passwordHash: await bcrypt.hash(password, 10),
      role: ROLES.CANTEEN_ADMIN,
      phone: phone || null
    });

    res.status(201).json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        isActive: user.isActive
      }
    });
  })
);

router.patch(
  "/:id/status",
  asyncHandler(async (req, res) => {
    const { isActive } = req.body;
    if (typeof isActive !== "boolean") {
      throw createHttpError(400, "isActive must be boolean");
    }
    const user = await User.findOneAndUpdate(
      { _id: req.params.id, role: ROLES.CANTEEN_ADMIN },
      { isActive },
      { new: true }
    ).select("-passwordHash");

    if (!user) throw createHttpError(404, "Canteen admin not found");
    res.json({ user });
  })
);

export default router;

