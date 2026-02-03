import { Router } from "express";
import { AuthController } from "../controller/auth_controller";
import { authMiddleware } from "../middleware/auth";
import { upload } from "../config/multer";

let authController = new AuthController();
const router = Router();

router.post("/register", authController.register)
router.post("/login", authController.login)
// PUT /api/auth/:id - Update user profile (protected, with optional image upload)
router.put("/:id", authMiddleware, upload.single('image'), (req, res) => authController.updateProfile(req, res))
// add remaning routes like login, logout, etc.

export default router;