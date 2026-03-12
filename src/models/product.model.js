import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
    },
    desc: {
      type: String,
      default: "",
    },
    cat: {
      type: String,
      enum: ["men", "women", "children"],
      required: [true, "Category is required"],
    },
    price: {
      type: Number,
      required: [true, "Price is required"],
      min: [0, "Price cannot be negative"],
    },
    disc: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    quantity: {
      type: Number,
      default: 100,
      min: 0,
    },
    // stock is auto-derived from quantity: out=0, low=1-9, in=10+
    // But can also be manually set if quantity is not tracked
    stock: {
      type: String,
      enum: ["in", "low", "out"],
      default: "in",
    },
    sizes: {
      type: [String],
      default: [],
    },
    // Primary image
    img: {
      type: String,
      default: "",
    },
    imgPublicId: {
      type: String,
      default: null,   // Cloudinary public_id — null if URL was pasted manually
    },
    // Secondary / hover image
    img2: {
      type: String,
      default: null,
    },
    img2PublicId: {
      type: String,
      default: null,
    },
     img3: {
      type: String,
      default: null,
    },
    img3PublicId: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);

// Auto-derive stock status from quantity
productSchema.pre("save", function (next) {
  if (this.isModified("quantity") || this.isNew) {
    if (this.quantity <= 0)  this.stock = "out";
    else if (this.quantity < 10) this.stock = "low";
    else this.stock = "in";
  }
  next();
});

// Same for findOneAndUpdate / findByIdAndUpdate
productSchema.pre(["findOneAndUpdate", "updateOne", "findByIdAndUpdate"], function (next) {
  const update = this.getUpdate();
  const qty = update?.$set?.quantity ?? update?.quantity;
  if (qty !== undefined) {
    const stockVal = qty <= 0 ? "out" : qty < 10 ? "low" : "in";
    if (update.$set) update.$set.stock = stockVal;
    else update.stock = stockVal;
  }
  next();
});

export const Product = mongoose.model("Product", productSchema);
