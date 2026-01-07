import { Router } from "express";
import * as usageController from "../controllers/usage.controller";
import { authMiddleware } from "../middleware/auth";

const router = Router();

router.get("/", authMiddleware, usageController.getUserUsage);
router.get("/project/:projectId", authMiddleware, usageController.getProjectUsage);

export { router as usageRouter };
