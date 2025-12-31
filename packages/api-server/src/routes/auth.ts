import { Router } from "express";
import { login, register } from "../controllers/auth.controller";
import { validateBody } from "../middleware/validate";
import { RegisterSchema, LoginSchema } from "../schemas/auth.schema";

const router = Router();

// Password-based authentication (both require CSRF protection)
router.post("/register", validateBody(RegisterSchema), register);
router.post("/login", validateBody(LoginSchema), login);

// Note: OAuth callback is handled separately in index.ts without CSRF protection

export { router as authRouter };
