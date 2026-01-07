import { Router } from "express";
import * as obsController from "../controllers/observability.controller";
import { authMiddleware } from "../middleware/auth";

const router = Router();

router.get("/project/:projectId/metrics", authMiddleware, obsController.getProjectMetrics);
router.get("/deployment/:deploymentId/logs", authMiddleware, obsController.getDeploymentLogs);

export { router as observabilityRouter };
