import multer from "multer";
import path from "path";
import fs from "fs";

const UPLOAD_DIR = "/tmp/uploads";
const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB

// Ensure upload directory exists
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Multer configuration with security limits
export const uploadMiddleware = multer({
  dest: UPLOAD_DIR,
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: 1, // Only one file at a time
    fields: 10, // Maximum number of non-file fields
    fieldSize: 1024 * 1024, // 1MB max field size
  },
  fileFilter: (req, file, cb) => {
    // Only allow zip files
    const allowedMimeTypes = [
      "application/zip",
      "application/x-zip-compressed",
      "application/x-zip",
    ];

    const allowedExtensions = [".zip"];
    const ext = path.extname(file.originalname).toLowerCase();

    if (allowedMimeTypes.includes(file.mimetype) && allowedExtensions.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error("Only .zip files are allowed"));
    }
  },
});
