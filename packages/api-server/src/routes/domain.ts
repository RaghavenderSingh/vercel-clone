import { Router } from "express";
import { authMiddleware } from "../middleware/auth";
import * as domainController from "../controllers/domain.controller";

const router = Router({ mergeParams: true });

// All routes require authentication
router.use(authMiddleware);

// Domain Routes
router.get("/", domainController.getDomains);
router.post("/", domainController.addDomain);
router.delete("/:domain", domainController.removeDomain);
router.post("/:domain/verify", domainController.verifyDomain);

export default router;
