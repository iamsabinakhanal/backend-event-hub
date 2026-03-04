import { Router } from "express";
import { AuthController } from "../controller/auth_controller";
import { authMiddleware, adminMiddleware } from "../middleware/auth";
import { upload } from "../config/multer";

let authController = new AuthController();
const router = Router();

router.post("/register", authController.register)
router.post("/login", authController.login)
// GET /api/auth/whoami - Get current authenticated user
router.get("/whoami", authMiddleware, (req, res) => authController.whoami(req, res))
// PUT /api/auth/update-profile - Update current user's profile
router.put("/update-profile", authMiddleware, upload.single('image'), (req, res) => authController.updateCurrentProfile(req, res))
// POST /api/auth/request-password-reset - Request password reset
router.post("/request-password-reset", (req, res) => authController.requestPasswordReset(req, res))
// POST /api/auth/reset-password/:token - Reset password with token
router.post("/reset-password/:token", (req, res) => authController.resetPassword(req, res))
// POST /api/auth/admin/create - Create admin user (admin only)
router.post("/admin/create", authMiddleware, adminMiddleware, (req, res) => authController.createAdmin(req, res))
// PUT /api/auth/:id - Update user profile (protected, with optional image upload)
router.put("/:id", authMiddleware, upload.single('image'), (req, res) => authController.updateProfile(req, res))
// add remaning routes like login, logout, etc.

export default router;