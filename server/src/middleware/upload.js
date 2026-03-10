import multer from "multer";
import path from "path";
import fs from "fs";

// Ensure directories exist
const ensureDir = (dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

// Configure storage factory
const createStorage = (directory) => {
  ensureDir(directory);
  return multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, directory);
    },
    filename: function (req, file, cb) {
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
      cb(
        null,
        file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname),
      );
    },
  });
};

// File filter for images
const fileFilter = (req, file, cb) => {
  if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
    return cb(new Error("Only image files are allowed!"), false);
  }
  cb(null, true);
};

// Avatar upload middleware
export const upload = multer({
  storage: createStorage("uploads/avatars"),
  fileFilter: fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
});

// Task proof upload middleware (single - kept for backward compat)
export const uploadProof = multer({
  storage: createStorage("uploads/proofs"),
  fileFilter: fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit for proofs
});

// Task proof upload middleware (multiple - up to 5 files)
export const uploadProofs = multer({
  storage: createStorage("uploads/proofs"),
  fileFilter: fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB per file
});

