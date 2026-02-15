import mongoose from "mongoose";

const canteenProfileSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, default: "Cafe Roma", trim: true },
    contactPhone: { type: String, default: "", trim: true },
    email: { type: String, default: "", trim: true },
    locationText: { type: String, default: "", trim: true },
    openHours: { type: String, default: "", trim: true },
    isActive: { type: Boolean, default: true },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null }
  },
  { timestamps: true }
);

canteenProfileSchema.index(
  { isActive: 1 },
  {
    unique: true,
    partialFilterExpression: { isActive: true }
  }
);

export const CanteenProfile = mongoose.model("CanteenProfile", canteenProfileSchema);

