import { Router } from "express";
import { authMiddleware } from "../middleware/auth";
import { FavoriteController } from "../controller/favorite_controller";

const router = Router();

// GET /api/favorites - Get all favorites (admin: all, user: own)
router.get("/", authMiddleware, FavoriteController.getAll);

// POST /api/favorites - Add service to favorites
router.post("/", authMiddleware, FavoriteController.create);

// GET /api/favorites/:id - Get a specific favorite
router.get("/:id", authMiddleware, FavoriteController.getById);

// PUT /api/favorites/:id - Update a favorite
router.put("/:id", authMiddleware, FavoriteController.update);

// DELETE /api/favorites/:id - Delete a favorite
router.delete("/:id", authMiddleware, FavoriteController.delete);

export default router;
