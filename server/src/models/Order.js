import mongoose from "mongoose";
import { ORDER_STATUS, PAYMENT_METHOD, PAYMENT_STATUS } from "../constants/order.js";

const orderItemSchema = new mongoose.Schema(
  {
    menuItemId: { type: mongoose.Schema.Types.ObjectId, ref: "MenuItem", required: true },
    nameSnapshot: { type: String, required: true },
    priceSnapshot: { type: Number, required: true, min: 0 },
    qty: { type: Number, required: true, min: 1 }
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    canteenProfileId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CanteenProfile",
      required: true
    },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    items: { type: [orderItemSchema], required: true, validate: [(v) => v.length > 0, "Items required"] },
    total: { type: Number, required: true, min: 0 },
    paymentMethod: {
      type: String,
      enum: Object.values(PAYMENT_METHOD),
      default: PAYMENT_METHOD.PAY_AT_CANTEEN
    },
    paymentStatus: {
      type: String,
      enum: Object.values(PAYMENT_STATUS),
      default: PAYMENT_STATUS.UNPAID
    },
    status: {
      type: String,
      enum: Object.values(ORDER_STATUS),
      default: ORDER_STATUS.PLACED
    },
    statusHistory: [
      {
        status: { type: String, enum: Object.values(ORDER_STATUS), required: true },
        at: { type: Date, default: Date.now }
      }
    ]
  },
  { timestamps: true }
);

export const Order = mongoose.model("Order", orderSchema);

