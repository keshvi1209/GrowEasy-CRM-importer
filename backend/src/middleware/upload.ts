import multer from "multer";
import { Request } from "express";

const MAX_FILE_SIZE_MB = Number(process.env.MAX_FILE_SIZE_MB || 15);

function fileFilter(
  _req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) {
  const isCsv =
    file.mimetype === "text/csv" ||
    file.mimetype === "application/vnd.ms-excel" ||
    file.mimetype === "application/csv" ||
    file.originalname.toLowerCase().endsWith(".csv");

  if (!isCsv) {
    cb(new Error("Only .csv files are supported."));
    return;
  }
  cb(null, true);
}

// Keep the file in memory -- we never need it on disk, and this keeps the
// service stateless (no cleanup jobs, works fine on ephemeral filesystems
// like Vercel/Render).
export const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE_MB * 1024 * 1024 },
  fileFilter,
});
