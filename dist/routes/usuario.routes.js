import { Router } from "express";
import { getAll, create, getOne, remove } from "../controllers/usuario.controller.js";
const router = Router();
router.get("/", getAll);
router.post("/", create);
router.get("/:id", getOne);
router.delete("/:id", remove);
export default router;
