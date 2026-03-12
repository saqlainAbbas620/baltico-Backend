import { Router } from "express";
import {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  uploadProductImage,
  deleteProductImage,
} from "../controllers/product.controller.js";
import { verifyToken, isAdmin } from "../middlewares/auth.middleware.js";
import { conditionalUploadSingle, conditionalUploadProductImages } from "../middlewares/upload.middleware.js";

const router = Router();

// ── IMPORTANT: specific paths MUST come before /:id ──────────────────────────

// Public
router.get("/",    getProducts);

// Standalone image endpoints — file uploads only, always multipart
router.post  ("/upload-image",  verifyToken, isAdmin, conditionalUploadSingle,         uploadProductImage);
router.delete("/delete-image",  verifyToken, isAdmin,                                  deleteProductImage);

// Admin — create (JSON or multipart)
router.post  ("/",              verifyToken, isAdmin, conditionalUploadProductImages,   createProduct);

// Public — single product (after all fixed paths)
router.get   ("/:id",           getProductById);

// Admin — update / delete (JSON or multipart)
router.put   ("/:id",           verifyToken, isAdmin, conditionalUploadProductImages,   updateProduct);
router.delete("/:id",           verifyToken, isAdmin,                                   deleteProduct);

export default router;
