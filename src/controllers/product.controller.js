import { Product } from "../models/product.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadToCloudinary, deleteFromCloudinary } from "../config/cloudinary.js";

// ── GET /api/products ─────────────────────────────────────────────────────────
// Query params:
//   ?category=men|women|children   filter by category
//   ?sort=asc|desc                 sort by price
//   ?new=true                      return all products newest-first (All Products page)
//   ?search=q                      title/desc search
export const getProducts = asyncHandler(async (req, res) => {
  const { category, sort, new: isNew, search } = req.query;

  const filter = {};

  if (category && ["men", "women", "children"].includes(category)) {
    filter.cat = category;
  }

  if (search) {
    filter.$or = [
      { title: { $regex: search, $options: "i" } },
      { desc:  { $regex: search, $options: "i" } },
    ];
  }

  // Default sort
  let sortOption = { createdAt: -1 };
  if (isNew === "true") {
    sortOption = { createdAt: -1 };   // newest first — used by All Products page
  } else if (sort === "asc") {
    sortOption = { price: 1 };
  } else if (sort === "desc") {
    sortOption = { price: -1 };
  }

  const products = await Product.find(filter).sort(sortOption);
  res.json(new ApiResponse(200, { products, total: products.length }));
});

// ── GET /api/products/:id ─────────────────────────────────────────────────────
export const getProductById = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) throw new ApiError(404, "Product not found");
  res.json(new ApiResponse(200, { product }));
});

// ── POST /api/products  (admin only) ─────────────────────────────────────────
// Accepts multipart/form-data with optional files: img, img2
// OR plain JSON with img/img2 as URLs
export const createProduct = asyncHandler(async (req, res) => {
  const { title, desc, cat, price, disc, stock, sizes, quantity } = req.body;

  if (!title || !cat || !price) {
    throw new ApiError(400, "Title, category and price are required");
  }

  // ── Handle img (file upload or URL) ───────────────────────────────────────
  let imgUrl = req.body.img || "";
  let imgPublicId = null;

  if (req.files?.img?.[0]) {
    // File uploaded — push to Cloudinary
    const result = await uploadToCloudinary(
      req.files.img[0].buffer,
      "BaltiCo/products"
    );
    imgUrl = result.url;
    imgPublicId = result.publicId;
  }

  // ── Handle img2 (file upload or URL) ──────────────────────────────────────
  let img2Url = req.body.img2 || null;
  let img2PublicId = null;

  if (req.files?.img2?.[0]) {
    const result = await uploadToCloudinary(
      req.files.img2[0].buffer,
      "BaltiCo/products"
    );
    img2Url = result.url;
    img2PublicId = result.publicId;
  }

  const parsedSizes = typeof sizes === "string"
    ? sizes.split(",").map((s) => s.trim()).filter(Boolean)
    : sizes || [];

  const product = await Product.create({
    title,
    desc: desc || "",
    cat,
    price: +price,
    disc: +(disc || 0),
    stock: stock || "in",
    quantity: quantity !== undefined ? +quantity : 100,
    sizes: parsedSizes,
    img: imgUrl,
    imgPublicId,
    img2: img2Url,
    img2PublicId,
  });

  res.status(201).json(new ApiResponse(201, { product }, "Product created"));
});

// ── PUT /api/products/:id  (admin only) ───────────────────────────────────────
export const updateProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) throw new ApiError(404, "Product not found");

  const { _id, __v, createdAt, updatedAt, ...body } = req.body;
  const updates = { ...body };

  // ── img: new file uploaded? ────────────────────────────────────────────────
  if (req.files?.img?.[0]) {
    // Delete old Cloudinary image if it was uploaded (not a pasted URL)
    await deleteFromCloudinary(product.imgPublicId);

    const result = await uploadToCloudinary(
      req.files.img[0].buffer,
      "BaltiCo/products"
    );
    updates.img = result.url;
    updates.imgPublicId = result.publicId;
  } else if (body.img !== undefined && body.img !== product.img) {
    // URL was changed manually — delete old Cloudinary image
    await deleteFromCloudinary(product.imgPublicId);
    updates.imgPublicId = null; // new image is just a URL, no publicId
  }

  // ── img2: new file uploaded? ───────────────────────────────────────────────
  if (req.files?.img2?.[0]) {
    await deleteFromCloudinary(product.img2PublicId);

    const result = await uploadToCloudinary(
      req.files.img2[0].buffer,
      "BaltiCo/products"
    );
    updates.img2 = result.url;
    updates.img2PublicId = result.publicId;
  } else if (body.img2 !== undefined && body.img2 !== product.img2) {
    await deleteFromCloudinary(product.img2PublicId);
    updates.img2PublicId = null;
  }

  // ── img2 explicitly cleared (set to empty string / null) ─────────────────
  if (updates.img2 === "" || updates.img2 === "null") {
    await deleteFromCloudinary(product.img2PublicId);
    updates.img2 = null;
    updates.img2PublicId = null;
  }

  // Parse sizes if sent as comma string
  if (typeof updates.sizes === "string") {
    updates.sizes = updates.sizes.split(",").map((s) => s.trim()).filter(Boolean);
  }

  const updated = await Product.findByIdAndUpdate(
    req.params.id,
    { $set: updates },
    { new: true, runValidators: true }
  );

  res.json(new ApiResponse(200, { product: updated }, "Product updated"));
});

// ── DELETE /api/products/:id  (admin only) ────────────────────────────────────
export const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) throw new ApiError(404, "Product not found");

  // Delete both images from Cloudinary before removing the DB record
  await Promise.all([
    deleteFromCloudinary(product.imgPublicId),
    deleteFromCloudinary(product.img2PublicId),
  ]);

  await product.deleteOne();

  res.json(new ApiResponse(200, {}, "Product deleted"));
});

// ── POST /api/products/upload-image  (admin only) ─────────────────────────────
// Standalone endpoint to upload a single image and get back the URL + publicId.
// Used by the frontend ImageUploader when uploading before form submit.
export const uploadProductImage = asyncHandler(async (req, res) => {
  if (!req.file) throw new ApiError(400, "No image file provided");

  const result = await uploadToCloudinary(req.file.buffer, "BaltiCo/products");

  res.json(
    new ApiResponse(201, { url: result.url, publicId: result.publicId }, "Image uploaded")
  );
});

// ── DELETE /api/products/delete-image  (admin only) ───────────────────────────
// Standalone endpoint to delete a Cloudinary image by publicId.
// Used when admin removes an image without deleting the whole product.
export const deleteProductImage = asyncHandler(async (req, res) => {
  const { publicId } = req.body;
  if (!publicId) throw new ApiError(400, "publicId is required");

  await deleteFromCloudinary(publicId);

  res.json(new ApiResponse(200, {}, "Image deleted from Cloudinary"));
});
