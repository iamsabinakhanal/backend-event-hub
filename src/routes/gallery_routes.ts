import { Router } from "express";
import { authMiddleware, adminMiddleware } from "../middleware/auth";
import { galleryUpload } from "../config/multer";
import { GalleryController } from "../controller/gallery_controller";

const router = Router();

// GET /api/gallery - Get all gallery images
router.get("/", GalleryController.listAll);

// POST /api/gallery - Upload a gallery image (admin only)
router.post("/", authMiddleware, adminMiddleware, galleryUpload.single('image'), GalleryController.create);

// GET /api/gallery/category/:category - Get gallery images by category
router.get("/category/:category", GalleryController.getByCategory);

// GET /api/gallery/:id - Get a specific gallery image
router.get("/:id", GalleryController.getById);

// PUT /api/gallery/:id - Update gallery image details (admin only)
router.put("/:id", authMiddleware, adminMiddleware, galleryUpload.single('image'), GalleryController.update);

// DELETE /api/gallery/:id - Delete a gallery image (admin only)
router.delete("/:id", authMiddleware, adminMiddleware, GalleryController.delete);

export default router;
