import express from "express";
import { MenuItem } from "../models/MenuItem.js";
import { CanteenProfile } from "../models/CanteenProfile.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { ROLES } from "../constants/roles.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { createHttpError } from "../utils/httpError.js";

const router = express.Router();

async function getActiveCanteenOrThrow() {
  const profile = await CanteenProfile.findOne({ isActive: true }).lean();
  if (!profile) throw createHttpError(400, "No active canteen profile found");
  return profile;
}

router.get(
  "/",
  requireAuth,
  asyncHandler(async (req, res) => {
    const { available } = req.query;
    const active = await getActiveCanteenOrThrow();
    const query = { canteenProfileId: active._id };

    if (available === "true") {
      query.isAvailable = true;
    }

    const items = await MenuItem.find(query).sort({ createdAt: -1 }).lean();
    res.json({ items });
  })
);

router.post(
  "/",
  requireAuth,
  requireRole(ROLES.CANTEEN_ADMIN, ROLES.SUPER_ADMIN),
  asyncHandler(async (req, res) => {
    const { name, description, price, category, imageUrl, isAvailable } = req.body;
    if (!name || price === undefined || !category) {
      throw createHttpError(400, "name, price and category are required");
    }
    const active = await getActiveCanteenOrThrow();
    const item = await MenuItem.create({
      canteenProfileId: active._id,
      name,
      description,
      price,
      category,
      imageUrl: imageUrl || "",
      isAvailable: isAvailable ?? true
    });
    res.status(201).json({ item });
  })
);

router.put(
  "/:id",
  requireAuth,
  requireRole(ROLES.CANTEEN_ADMIN, ROLES.SUPER_ADMIN),
  asyncHandler(async (req, res) => {
    const item = await MenuItem.findById(req.params.id);
    if (!item) throw createHttpError(404, "Menu item not found");

    const { name, description, price, category, imageUrl, isAvailable } = req.body;
    item.name = name ?? item.name;
    item.description = description ?? item.description;
    item.price = price ?? item.price;
    item.category = category ?? item.category;
    item.imageUrl = imageUrl ?? item.imageUrl;
    item.isAvailable = isAvailable ?? item.isAvailable;
    await item.save();

    res.json({ item });
  })
);

router.patch(
  "/:id/availability",
  requireAuth,
  requireRole(ROLES.CANTEEN_ADMIN, ROLES.SUPER_ADMIN),
  asyncHandler(async (req, res) => {
    const { isAvailable } = req.body;
    if (typeof isAvailable !== "boolean") {
      throw createHttpError(400, "isAvailable must be boolean");
    }
    const item = await MenuItem.findByIdAndUpdate(
      req.params.id,
      { isAvailable },
      { new: true, runValidators: true }
    );
    if (!item) throw createHttpError(404, "Menu item not found");
    res.json({ item });
  })
);

router.delete(
  "/:id",
  requireAuth,
  requireRole(ROLES.CANTEEN_ADMIN, ROLES.SUPER_ADMIN),
  asyncHandler(async (req, res) => {
    const item = await MenuItem.findByIdAndDelete(req.params.id);
    if (!item) throw createHttpError(404, "Menu item not found");
    res.status(204).send();
  })
);

export default router;

