import { Router } from "express";
import {
  createProject,
  getProjects,
  getProject,
  deleteProject,
  updateBuildConfig,
} from "../controllers/project.controller";
import { authMiddleware } from "../middleware/auth";
import { validateBody } from "../middleware/validate";
import { CreateProjectSchema, UpdateProjectSchema } from "../schemas/project.schema";

const router = Router();

router.use(authMiddleware);

router.post("/", validateBody(CreateProjectSchema), createProject);
router.get("/", getProjects);
router.get("/:projectId", getProject);
router.delete("/:projectId", deleteProject);
router.patch("/:projectId/config", validateBody(UpdateProjectSchema), updateBuildConfig);

export { router as projectRouter };
