import mongoose from "mongoose";

const menuItemSchema = new mongoose.Schema(
  {
    canteenProfileId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CanteenProfile",
      required: true
    },
    name: { type: String, required: true, trim: true },
    description: { type: String, default: "", trim: true },
    price: { type: Number, required: true, min: 0 },
    category: { type: String, required: true, trim: true },
    imageUrl: { type: String, default: "", trim: true },
    isAvailable: { type: Boolean, default: true }
  },
  { timestamps: true }
);

export const MenuItem = mongoose.model("MenuItem", menuItemSchema);

