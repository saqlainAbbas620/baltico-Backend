import { Router } from "express";
import { getBanner, updateBanner, getCategoryImages, updateCategoryImage } from "../controllers/cms.controller.js";
import { verifyToken, isAdmin } from "../middlewares/auth.middleware.js";
import { conditionalUploadSingle } from "../middlewares/upload.middleware.js";

const router = Router();

router.get ("/banner",           getBanner);
router.put ("/banner",           verifyToken, isAdmin, conditionalUploadSingle, updateBanner);
router.get ("/categories",       getCategoryImages);
router.put ("/categories/:cat",  verifyToken, isAdmin, conditionalUploadSingle, updateCategoryImage);

export default router;
