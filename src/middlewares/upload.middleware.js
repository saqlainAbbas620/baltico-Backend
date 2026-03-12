import multer from "multer";

// Store files in memory (buffer) — we stream straight to Cloudinary
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowed = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only JPEG, PNG, WebP and GIF images are allowed"), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB max per file
});

// Single image — field name "image"
export const uploadSingle = upload.single("image");

// Two images — fields "img" and "img2"
export const uploadProductImages = upload.fields([
  { name: "img",  maxCount: 1 },
  { name: "img2", maxCount: 1 },
]);

// Conditional wrapper — only invokes multer when the request is multipart/form-data.
// For plain JSON requests (URL-paste saves), multer must NOT run because it does not
// parse application/json and would leave req.body empty.
export const conditionalUploadSingle = (req, res, next) => {
  const ct = req.headers["content-type"] || "";
  if (ct.includes("multipart/form-data")) {
    return uploadSingle(req, res, next);
  }
  next();
};

// Conditional wrapper for the two-field product upload (img + img2).
// Only invokes multer when the request is multipart/form-data.
export const conditionalUploadProductImages = (req, res, next) => {
  const ct = req.headers["content-type"] || "";
  if (ct.includes("multipart/form-data")) {
    return uploadProductImages(req, res, next);
  }
  next();
};
