import { Router } from "express";
import { AuthController } from "../controller/auth_controller";

const router = Router();
const authController = new AuthController();

router.post("/register", (req, res, next) => authController.register(req, res));
router.post("/login", (req, res, next) => authController.login(req, res));

export default router;
