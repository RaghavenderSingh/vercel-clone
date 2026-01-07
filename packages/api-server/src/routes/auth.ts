import { Router } from "express";
import { login, register } from "../controllers/auth.controller";
import { validateBody } from "../middleware/validate";
import { RegisterSchema, LoginSchema } from "../schemas/auth.schema";

const router = Router();

router.post("/register", validateBody(RegisterSchema), register);
router.post("/login", validateBody(LoginSchema), login);


export { router as authRouter };
