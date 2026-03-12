import mongoose from "mongoose";

const orderItemSchema = new mongoose.Schema({
  // Store as String so both MongoDB ObjectIds AND numeric seed-product IDs work.
  // We only use this for reference — title/price/img are the real source of truth.
  productId: { type: String, default: null },
  title:     { type: String, required: true },
  price:     { type: Number, required: true },
  qty:       { type: Number, required: true, min: 1 },
  size:      { type: String, required: true },
  img:       { type: String, default: "" },
});

const orderSchema = new mongoose.Schema(
  {
    orderId: {
      type: String,
      unique: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    items: [orderItemSchema],
    total: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "shipped", "delivered", "cancelled"],
      default: "pending",
    },
    addr: {
      type: String,
      required: [true, "Delivery address is required"],
    },
    phone: {
      type: String,
      default: "",
    },
    payment: {
      type: String,
      enum: ["cod"],
      default: "cod",
    },
    date: {
      type: String,
    },
  },
  { timestamps: true }
);

// Auto-generate order ID like PA-XXXXX before save
orderSchema.pre("save", function () {
  if (!this.orderId) {
    this.orderId = "PA-" + Date.now().toString(36).toUpperCase();
  }
  if (!this.date) {
    this.date = new Date().toISOString().split("T")[0];
  }
  // next();
});

export const Order = mongoose.model("Order", orderSchema);
