import dotenv from "dotenv";
dotenv.config();

import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import multer from "multer";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    const originalName = file.originalname;

    const nameWithoutExt = originalName.replace(/\.[^/.]+$/, "");
    const cleanName = nameWithoutExt.replace(/\s+/g, "_");
    
    const isRawFile =
      file.mimetype === "application/pdf" ||
      file.mimetype === "application/msword" ||
      file.mimetype ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
      file.mimetype === "application/zip";

    const extension = originalName.split(".").pop();

    return {
      folder: "journal_manuscripts",

      // ✅ KEY FIX (DOCX issue solved)
      resource_type: isRawFile ? "raw" : "image",

      // ✅ extension preserve (important for docx/pdf/zip)
      public_id: isRawFile
        ? `${cleanName}-${Date.now()}.${extension}`
        : `${cleanName}-${Date.now()}`,
    };
  },
});

// file filter (same - untouched)
const fileFilter = (req, file, cb) => {
  const isImage = file.mimetype.startsWith("image/");

  const isDoc =
    file.mimetype === "application/pdf" ||
    file.mimetype === "application/msword" ||
    file.mimetype ===
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    file.mimetype === "application/zip";

  if (isImage || isDoc) {
    cb(null, true);
  } else {
    cb(
      new Error("Only images (JPG, PNG, WEBP, etc.) or documents allowed"),
      false
    );
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB
  },
});

export default upload;