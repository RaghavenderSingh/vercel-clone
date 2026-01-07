import { Router } from "express";
import * as activityController from "../controllers/activity.controller";
import { authMiddleware } from "../middleware/auth";

const router = Router();

router.get("/", authMiddleware, activityController.getActivities);
router.get("/project/:projectId", authMiddleware, activityController.getProjectActivities);

export { router as activityRouter };
