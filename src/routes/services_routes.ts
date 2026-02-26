import { Router } from "express";
import { authMiddleware, adminMiddleware } from "../middleware/auth";
import { serviceUpload } from "../config/multer";
import { ServiceController } from "../controller/services_controller";

const router = Router();

// GET /api/services - Get all services
router.get("/", ServiceController.listAll);

// POST /api/services - Create a new service (admin only)
router.post("/", authMiddleware, adminMiddleware, serviceUpload.single('image'), ServiceController.create);

// GET /api/services/search - Search services
router.get("/search", ServiceController.search);

// GET /api/services/category/:category - Get services by category
router.get("/category/:category", ServiceController.getByCategory);

// GET /api/services/:id - Get a specific service
router.get("/:id", ServiceController.getById);

// GET /api/services/:id/bookings - Get all bookings for a specific service (admin only)
router.get("/:id/bookings", authMiddleware, adminMiddleware, ServiceController.getServiceBookings);

// PUT /api/services/:id - Update a service (admin only)
router.put("/:id", authMiddleware, adminMiddleware, serviceUpload.single('image'), ServiceController.update);

// DELETE /api/services/:id - Delete a service (admin only)
router.delete("/:id", authMiddleware, adminMiddleware, ServiceController.delete);

export default router;
