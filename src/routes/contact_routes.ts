import { Router } from "express";
import { authMiddleware, adminMiddleware } from "../middleware/auth";
import { ContactController } from "../controller/contact_controller";

const router = Router();

// GET /api/contact - Get all contact messages (admin only)
router.get("/", authMiddleware, adminMiddleware, ContactController.getAll);

// POST /api/contact - Submit a contact form
router.post("/", ContactController.submit);

// GET /api/contact/:id - Get a specific contact message
router.get("/:id", authMiddleware, ContactController.getById);

// DELETE /api/contact/:id - Delete a contact message (admin only)
router.delete("/:id", authMiddleware, adminMiddleware, ContactController.delete);

// POST /api/contact/:id/reply - Reply to a contact message (admin only)
router.post("/:id/reply", authMiddleware, adminMiddleware, ContactController.reply);

export default router;
