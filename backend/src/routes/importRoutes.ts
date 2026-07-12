import { Router } from "express";
import { upload } from "../middleware/upload";
import { startImport, getImportStatus, healthCheck } from "../controllers/importController";

const router = Router();

router.get("/health", healthCheck);
router.post("/import", upload.single("csv"), startImport);
router.get("/import/:jobId", getImportStatus);

export default router;
