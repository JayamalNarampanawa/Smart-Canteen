import express from "express";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { ROLES } from "../constants/roles.js";
import { Order } from "../models/Order.js";
import { Rating } from "../models/Rating.js";
import { ORDER_STATUS } from "../constants/order.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { createHttpError } from "../utils/httpError.js";

const router = express.Router();

router.post(
  "/",
  requireAuth,
  requireRole(ROLES.USER),
  asyncHandler(async (req, res) => {
    const { orderId, menuItemId, rating, comment } = req.body;
    if (!orderId || !rating) throw createHttpError(400, "orderId and rating are required");

    const order = await Order.findOne({ _id: orderId, userId: req.auth.userId }).lean();
    if (!order) throw createHttpError(404, "Order not found");
    if (order.status !== ORDER_STATUS.COLLECTED) {
      throw createHttpError(400, "Ratings are allowed only after order is COLLECTED");
    }

    const created = await Rating.create({
      orderId,
      userId: req.auth.userId,
      menuItemId: menuItemId || null,
      rating,
      comment: comment || ""
    });

    res.status(201).json({ rating: created });
  })
);

router.get(
  "/",
  requireAuth,
  requireRole(ROLES.CANTEEN_ADMIN, ROLES.SUPER_ADMIN),
  asyncHandler(async (req, res) => {
    const ratings = await Rating.find({})
      .populate("userId", "name email")
      .populate("orderId", "status createdAt")
      .populate("menuItemId", "name")
      .sort({ createdAt: -1 })
      .lean();
    res.json({ ratings });
  })
);

router.get(
  "/analytics/summary",
  requireAuth,
  requireRole(ROLES.SUPER_ADMIN),
  asyncHandler(async (req, res) => {
    const [agg] = await Rating.aggregate([
      {
        $group: {
          _id: null,
          avgRating: { $avg: "$rating" },
          count: { $sum: 1 }
        }
      }
    ]);

    const latestComments = await Rating.find({ comment: { $ne: "" } })
      .sort({ createdAt: -1 })
      .limit(10)
      .populate("userId", "name")
      .lean();

    res.json({
      averageRating: agg?.avgRating || 0,
      totalRatings: agg?.count || 0,
      latestComments
    });
  })
);

export default router;

