import { CMS } from "../models/cms.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadToCloudinary, deleteFromCloudinary } from "../config/cloudinary.js";

const BANNER_KEY     = "homepage_banner";
const DEFAULT_BANNER = "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1600";

const CATEGORY_DEFAULTS = {
  cat_women:    "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=700",
  cat_men:      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=700",
  cat_children: "https://images.unsplash.com/photo-1519689680058-324335c77eba?w=700",
};

// ── GET /api/cms/banner ───────────────────────────────────────────────────────
export const getBanner = asyncHandler(async (req, res) => {
  let banner = await CMS.findOne({ key: BANNER_KEY });
  if (!banner) banner = await CMS.create({ key: BANNER_KEY, value: DEFAULT_BANNER, publicId: null });
  res.json(new ApiResponse(200, { url: banner.value, publicId: banner.publicId }));
});

// ── PUT /api/cms/banner  (admin) ──────────────────────────────────────────────
export const updateBanner = asyncHandler(async (req, res) => {
  const existing  = await CMS.findOne({ key: BANNER_KEY });
  let newUrl      = null;
  let newPublicId = null;

  if (req.file) {
    if (existing?.publicId) await deleteFromCloudinary(existing.publicId);
    const result = await uploadToCloudinary(req.file.buffer, "BaltiCo/banners");
    newUrl      = result.url;
    newPublicId = result.publicId;
  } else if (req.body.url) {
    newUrl      = req.body.url;
    newPublicId = req.body.publicId || null;
    if (existing?.publicId && existing.publicId !== newPublicId) {
      await deleteFromCloudinary(existing.publicId);
    }
  } else {
    throw new ApiError(400, "Provide an image file or a banner URL");
  }

  const banner = await CMS.findOneAndUpdate(
    { key: BANNER_KEY },
    { value: newUrl, publicId: newPublicId },
    { new: true, upsert: true }
  );

  res.json(new ApiResponse(200, { url: banner.value, publicId: banner.publicId }, "Banner updated"));
});

// ── GET /api/cms/categories ───────────────────────────────────────────────────
// Returns all category images as { women: url, men: url, children: url }
export const getCategoryImages = asyncHandler(async (req, res) => {
  const keys = Object.keys(CATEGORY_DEFAULTS);
  const docs  = await CMS.find({ key: { $in: keys } });

  const result = {};
  for (const key of keys) {
    const cat = key.replace("cat_", ""); // "cat_women" → "women"
    const doc = docs.find(d => d.key === key);
    result[cat] = {
      url:      doc?.value    || CATEGORY_DEFAULTS[key],
      publicId: doc?.publicId || null,
    };
  }

  res.json(new ApiResponse(200, { categories: result }));
});

// ── PUT /api/cms/categories/:cat  (admin) ─────────────────────────────────────
export const updateCategoryImage = asyncHandler(async (req, res) => {
  const { cat } = req.params;
  const key     = `cat_${cat}`;

  if (!CATEGORY_DEFAULTS[key]) {
    throw new ApiError(400, "Category must be women, men, or children");
  }

  const existing  = await CMS.findOne({ key });
  let newUrl      = null;
  let newPublicId = null;

  if (req.file) {
    if (existing?.publicId) await deleteFromCloudinary(existing.publicId);
    const result = await uploadToCloudinary(req.file.buffer, "BaltiCo/categories");
    newUrl      = result.url;
    newPublicId = result.publicId;
  } else if (req.body.url) {
    newUrl      = req.body.url;
    newPublicId = req.body.publicId || null;
    if (existing?.publicId && existing.publicId !== newPublicId) {
      await deleteFromCloudinary(existing.publicId);
    }
  } else {
    throw new ApiError(400, "Provide an image file or a URL");
  }

  const doc = await CMS.findOneAndUpdate(
    { key },
    { value: newUrl, publicId: newPublicId },
    { new: true, upsert: true }
  );

  res.json(new ApiResponse(200, { url: doc.value, publicId: doc.publicId, cat }, "Category image updated"));
});
