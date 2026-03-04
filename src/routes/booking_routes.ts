import { Router } from "express";
import { authMiddleware, adminMiddleware } from "../middleware/auth";
import { BookingController } from "../controller/booking_controller";

const router = Router();

// GET /api/bookings - Get all bookings (admin: all, user: own)
router.get("/", authMiddleware, BookingController.getAll);

// POST /api/bookings - Create a new booking
router.post("/", authMiddleware, BookingController.create);

// GET /api/bookings/:id/status - Get booking status
router.get("/:id/status", authMiddleware, BookingController.getStatus);

// PUT /api/bookings/:id/status - Update booking status (admin only)
router.put("/:id/status", authMiddleware, adminMiddleware, BookingController.updateStatus);

// GET /api/bookings/:id - Get a specific booking
router.get("/:id", authMiddleware, BookingController.getById);

// PUT /api/bookings/:id - Update a booking
router.put("/:id", authMiddleware, BookingController.update);

// DELETE /api/bookings/:id - Cancel a booking
router.delete("/:id", authMiddleware, BookingController.delete);

export default router;
