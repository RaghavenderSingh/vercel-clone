import { Router } from "express";
import {
  createDeployments,
  getDeployment,
  getDeploymentByProject,
  cancelDeployments,
  listDeployments,
  deployProject,
} from "../controllers/deployment.controller";
import { authMiddleware } from "../middleware/auth";
import { validateBody } from "../middleware/validate";
import { CreateDeploymentSchema } from "../schemas/deployment.schema";
import { uploadMiddleware } from "../middleware/upload";

const router = Router();

router.use(authMiddleware);

router.get("/", listDeployments);
router.post("/", validateBody(CreateDeploymentSchema), createDeployments);
router.post("/upload", uploadMiddleware.single("file"), deployProject);
router.get("/:deploymentId", getDeployment);
router.get("/project/:projectId", getDeploymentByProject);
router.post("/:deploymentId/cancel", cancelDeployments);

export { router as deploymentRouter };
