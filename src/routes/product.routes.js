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
import { uploadProductImages, uploadSingle } from "../middlewares/upload.middleware.js";

const router = Router();


// Public
router.get("/",    getProducts);

// Standalone image endpoints — before /:id
router.post ("/upload-image",  verifyToken, isAdmin, uploadSingle,         uploadProductImage);
router.delete("/delete-image",  verifyToken, isAdmin,                       deleteProductImage);

// Admin — create
router.post  ("/",              verifyToken, isAdmin, uploadProductImages,   createProduct);

// Public — single product (after all fixed paths)
router.get   ("/:id",           getProductById);

// Admin — update / delete
router.put   ("/:id",           verifyToken, isAdmin, uploadProductImages,   updateProduct);
router.delete("/:id",           verifyToken, isAdmin,                        deleteProduct);

export default router;
