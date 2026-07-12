import { Request, Response, NextFunction } from "express";
import { MulterError } from "multer";

// Express requires all four params for an error handler to be recognized,
// even though `next` is unused here.
export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (err instanceof MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      res.status(413).json({ error: "File too large. Maximum size exceeded." });
      return;
    }
    res.status(400).json({ error: `Upload error: ${err.message}` });
    return;
  }

  if (err.message === "Only .csv files are supported.") {
    res.status(400).json({ error: err.message });
    return;
  }

  console.error("Unhandled error:", err);
  res.status(500).json({ error: "Internal server error." });
}
