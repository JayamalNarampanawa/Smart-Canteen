import express from "express";
import mongoose from "mongoose";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { ROLES } from "../constants/roles.js";
import { ORDER_STATUS, PAYMENT_METHOD } from "../constants/order.js";
import { Order } from "../models/Order.js";
import { MenuItem } from "../models/MenuItem.js";
import { CanteenProfile } from "../models/CanteenProfile.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { createHttpError } from "../utils/httpError.js";

const router = express.Router();

function canUserEdit(order) {
  return order.status === ORDER_STATUS.PLACED;
}

async function activeCanteenId() {
  const canteen = await CanteenProfile.findOne({ isActive: true }).lean();
  if (!canteen) throw createHttpError(400, "No active canteen profile found");
  return canteen._id;
}

router.post(
  "/",
  requireAuth,
  requireRole(ROLES.USER),
  asyncHandler(async (req, res) => {
    const { items, paymentMethod } = req.body;
    if (!Array.isArray(items) || items.length === 0) {
      throw createHttpError(400, "items are required");
    }

    const ids = items.map((x) => x.menuItemId).filter(Boolean);
    const objectIds = ids.map((id) => new mongoose.Types.ObjectId(id));
    const menuItems = await MenuItem.find({ _id: { $in: objectIds }, isAvailable: true }).lean();
    const menuMap = new Map(menuItems.map((item) => [item._id.toString(), item]));

    const normalizedItems = items.map((item) => {
      const menuItem = menuMap.get(String(item.menuItemId));
      if (!menuItem) throw createHttpError(400, `Menu item not available: ${item.menuItemId}`);
      const qty = Number(item.qty || 1);
      if (qty <= 0) throw createHttpError(400, "qty must be greater than 0");
      return {
        menuItemId: menuItem._id,
        nameSnapshot: menuItem.name,
        priceSnapshot: menuItem.price,
        qty
      };
    });

    const total = normalizedItems.reduce((sum, x) => sum + x.priceSnapshot * x.qty, 0);
    const order = await Order.create({
      canteenProfileId: await activeCanteenId(),
      userId: req.auth.userId,
      items: normalizedItems,
      total,
      paymentMethod:
        paymentMethod && Object.values(PAYMENT_METHOD).includes(paymentMethod)
          ? paymentMethod
          : PAYMENT_METHOD.PAY_AT_CANTEEN,
      status: ORDER_STATUS.PLACED,
      statusHistory: [{ status: ORDER_STATUS.PLACED }]
    });

    res.status(201).json({ order });
  })
);

router.get(
  "/",
  requireAuth,
  requireRole(ROLES.CANTEEN_ADMIN, ROLES.SUPER_ADMIN),
  asyncHandler(async (req, res) => {
    const query = {};
    if (req.query.status) query.status = req.query.status;
    const orders = await Order.find(query).populate("userId", "name email studentId phone").sort({ createdAt: -1 });
    res.json({ orders });
  })
);

router.get(
  "/my",
  requireAuth,
  requireRole(ROLES.USER),
  asyncHandler(async (req, res) => {
    const orders = await Order.find({ userId: req.auth.userId }).sort({ createdAt: -1 }).lean();
    res.json({ orders });
  })
);

router.put(
  "/:id",
  requireAuth,
  requireRole(ROLES.USER),
  asyncHandler(async (req, res) => {
    const order = await Order.findOne({ _id: req.params.id, userId: req.auth.userId });
    if (!order) throw createHttpError(404, "Order not found");
    if (!canUserEdit(order)) throw createHttpError(400, "Order can only be edited while PLACED");

    const { items } = req.body;
    if (!Array.isArray(items) || items.length === 0) {
      throw createHttpError(400, "items are required");
    }

    const ids = items.map((x) => x.menuItemId).filter(Boolean);
    const objectIds = ids.map((id) => new mongoose.Types.ObjectId(id));
    const menuItems = await MenuItem.find({ _id: { $in: objectIds }, isAvailable: true }).lean();
    const menuMap = new Map(menuItems.map((item) => [item._id.toString(), item]));

    const normalizedItems = items.map((item) => {
      const menuItem = menuMap.get(String(item.menuItemId));
      if (!menuItem) throw createHttpError(400, `Menu item not available: ${item.menuItemId}`);
      const qty = Number(item.qty || 1);
      if (qty <= 0) throw createHttpError(400, "qty must be greater than 0");
      return {
        menuItemId: menuItem._id,
        nameSnapshot: menuItem.name,
        priceSnapshot: menuItem.price,
        qty
      };
    });

    order.items = normalizedItems;
    order.total = normalizedItems.reduce((sum, x) => sum + x.priceSnapshot * x.qty, 0);
    await order.save();

    res.json({ order });
  })
);

router.patch(
  "/:id/cancel",
  requireAuth,
  requireRole(ROLES.USER),
  asyncHandler(async (req, res) => {
    const order = await Order.findOne({ _id: req.params.id, userId: req.auth.userId });
    if (!order) throw createHttpError(404, "Order not found");
    if (!canUserEdit(order)) throw createHttpError(400, "Order can only be cancelled while PLACED");

    order.status = ORDER_STATUS.CANCELLED;
    order.statusHistory.push({ status: ORDER_STATUS.CANCELLED });
    await order.save();

    res.json({ order });
  })
);

router.patch(
  "/:id/status",
  requireAuth,
  requireRole(ROLES.CANTEEN_ADMIN),
  asyncHandler(async (req, res) => {
    const { status } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order) throw createHttpError(404, "Order not found");

    const transitions = {
      [ORDER_STATUS.PLACED]: [ORDER_STATUS.ACCEPTED, ORDER_STATUS.REJECTED],
      [ORDER_STATUS.ACCEPTED]: [ORDER_STATUS.PREPARING],
      [ORDER_STATUS.PREPARING]: [ORDER_STATUS.READY],
      [ORDER_STATUS.READY]: [ORDER_STATUS.COLLECTED]
    };

    if (!transitions[order.status] || !transitions[order.status].includes(status)) {
      throw createHttpError(400, `Invalid status transition from ${order.status} to ${status}`);
    }

    order.status = status;
    order.statusHistory.push({ status });
    await order.save();
    res.json({ order });
  })
);

export default router;

