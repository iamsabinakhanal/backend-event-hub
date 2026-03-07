import { Router } from "express";
import { AuthController } from "../controller/auth_controller";
import { authMiddleware, adminMiddleware } from "../middleware/auth";
import { upload } from "../config/multer";

let authController = new AuthController();
const router = Router();

router.post("/register", (req, res) => authController.register(req, res))
router.post("/login", (req, res) => authController.login(req, res))
// GET /api/auth/whoami - Get current authenticated user
router.get("/whoami", authMiddleware, (req, res) => authController.whoami(req, res))
// GET /api/auth/profile - profile page data
router.get("/profile", authMiddleware, (req, res) => authController.getProfile(req, res))
// PUT /api/auth/update-profile - Update current user's profile
router.put("/update-profile", authMiddleware, upload.single('image'), (req, res) => authController.updateCurrentProfile(req, res))
// PUT /api/auth/profile - edit profile details and optional profile photo
router.put(
	"/profile",
	authMiddleware,
	upload.fields([
		{ name: 'photo', maxCount: 1 },
		{ name: 'image', maxCount: 1 },
		{ name: 'profilePicture', maxCount: 1 },
		{ name: 'profile_image', maxCount: 1 },
		{ name: 'avatar', maxCount: 1 }
	]),
	(req, res) => authController.updateProfilePage(req, res)
)
// PATCH /api/auth/profile/photo - update only profile photo
router.patch(
	"/profile/photo",
	authMiddleware,
	upload.fields([
		{ name: 'photo', maxCount: 1 },
		{ name: 'image', maxCount: 1 },
		{ name: 'profilePicture', maxCount: 1 },
		{ name: 'profile_image', maxCount: 1 },
		{ name: 'avatar', maxCount: 1 }
	]),
	(req, res) => authController.updateProfilePhoto(req, res)
)
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