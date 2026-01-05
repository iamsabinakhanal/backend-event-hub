import { Router } from "express";
import { AuthController } from "../controller/auth_controller";

const router = Router();
const authController = new AuthController();

/**
 * Authentication Routes for Event-Hub
 * - /register → User registration
 * - /login    → User login
 * 
 * Bind methods to preserve `this` context in class
 */
router.post("/register", authController.register.bind(authController));
router.post("/login", authController.login.bind(authController));

// TODO: Add remaining auth routes (logout, refresh token, password reset, etc.)

export default router;
 