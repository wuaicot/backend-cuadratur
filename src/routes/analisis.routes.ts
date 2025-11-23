import { Router } from "express";
import { procesarAnalisis } from "../controllers/analisis.controller";

const r = Router();
r.post("/process", procesarAnalisis); // POST /api/analisis/process
export default r;
