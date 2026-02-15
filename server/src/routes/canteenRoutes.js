import express from "express";
import { CanteenProfile } from "../models/CanteenProfile.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { ROLES } from "../constants/roles.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { createHttpError } from "../utils/httpError.js";

const router = express.Router();

async function getOrCreateActiveProfile() {
  let profile = await CanteenProfile.findOne({ isActive: true });
  if (!profile) {
    profile = await CanteenProfile.create({
      name: "Cafe Roma",
      isActive: true
    });
  }
  return profile;
}

router.get(
  "/active",
  requireAuth,
  asyncHandler(async (req, res) => {
    const profile = await getOrCreateActiveProfile();
    res.json({ profile });
  })
);

router.put(
  "/active",
  requireAuth,
  requireRole(ROLES.SUPER_ADMIN),
  asyncHandler(async (req, res) => {
    const { name, contactPhone, email, locationText, openHours } = req.body;
    const profile = await getOrCreateActiveProfile();

    if (name !== undefined && !String(name).trim()) {
      throw createHttpError(400, "name cannot be empty");
    }

    profile.name = name ?? profile.name;
    profile.contactPhone = contactPhone ?? profile.contactPhone;
    profile.email = email ?? profile.email;
    profile.locationText = locationText ?? profile.locationText;
    profile.openHours = openHours ?? profile.openHours;
    profile.updatedBy = req.auth.userId;
    await profile.save();

    res.json({ profile });
  })
);

export default router;

