import express from "express";
import multer from "multer";
import { procesarOCR } from "./ocr.controller";
const router = express.Router();
const upload = multer({ dest: "uploads/" });
router.post("/", upload.any(), procesarOCR);
export default router;
