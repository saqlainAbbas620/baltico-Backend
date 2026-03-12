import mongoose from "mongoose";

const cmsSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      unique: true,
      required: true,
    },
    value: {
      type: String,
      required: true,
    },
    publicId: {
      type: String,
      default: null,   // Cloudinary public_id for cleanup when banner changes
    },
  },
  { timestamps: true }
);

export const CMS = mongoose.model("CMS", cmsSchema);
