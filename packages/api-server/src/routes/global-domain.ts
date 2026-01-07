import { Router } from "express";
import { authMiddleware } from "../middleware/auth";
import * as domainController from "../controllers/domain.controller";

const router = Router();

router.use(authMiddleware);

router.get("/", domainController.getUserDomains);

export { router as globalDomainRouter };
