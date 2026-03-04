import type { Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import type { AuthRequest } from "../middleware/auth";
import { BookingService } from "../services/booking_service";
import { HttpError } from "../errors/http-errors";
import type {
  BookingCreateBody,
  BookingIdParams,
  BookingStatusBody,
  BookingUpdateBody,
} from "../types/booking_types";

export const BookingController = {
  getAll: asyncHandler(async (req: AuthRequest, res: Response) => {
    const authUser = req.user;
    if (!authUser?.id) {
      throw new HttpError(401, "Unauthorized");
    }

    let bookings;
    // If user is not admin, return only their bookings
    if (authUser.role !== "admin") {
      bookings = await BookingService.getBookingsByUserId(authUser.id);
    } else {
      bookings = await BookingService.getAllBookings();
    }

    res.status(200).json({
      success: true,
      message: "Bookings retrieved successfully",
      data: bookings,
    });
  }),

  getById: asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params as BookingIdParams;
    const booking = await BookingService.getBookingById(id);

    res.status(200).json({
      success: true,
      message: "Booking retrieved successfully",
      data: booking,
    });
  }),

  create: asyncHandler(async (req: AuthRequest, res: Response) => {
    const authUser = req.user;
    if (!authUser?.id) {
      throw new HttpError(401, "Unauthorized");
    }

    const body = req.body as BookingCreateBody;
    const { service_id, event_date, guest_count, special_requests, total_price } = body;
    const parsedGuestCount = Number(guest_count);
    const parsedTotalPrice = Number(total_price);

    if (!service_id || !event_date || Number.isNaN(parsedGuestCount) || Number.isNaN(parsedTotalPrice)) {
      throw new HttpError(400, "Missing required fields");
    }

    const booking = await BookingService.createBooking(authUser.id, {
      service_id,
      event_date,
      guest_count: parsedGuestCount,
      special_requests,
      total_price: parsedTotalPrice,
    });

    res.status(201).json({
      success: true,
      message: "Booking created successfully",
      data: booking,
    });
  }),

  update: asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params as BookingIdParams;
    const body = req.body as BookingUpdateBody;
    const { event_date, guest_count, special_requests, total_price } = body;
    const parsedGuestCount = guest_count === undefined ? undefined : Number(guest_count);
    const parsedTotalPrice = total_price === undefined ? undefined : Number(total_price);

    if (parsedGuestCount !== undefined && Number.isNaN(parsedGuestCount)) {
      throw new HttpError(400, "Invalid guest_count value");
    }

    if (parsedTotalPrice !== undefined && Number.isNaN(parsedTotalPrice)) {
      throw new HttpError(400, "Invalid total_price value");
    }

    const booking = await BookingService.updateBooking(id, {
      event_date,
      guest_count: parsedGuestCount,
      special_requests,
      total_price: parsedTotalPrice,
    });

    res.status(200).json({
      success: true,
      message: "Booking updated successfully",
      data: booking,
    });
  }),

  delete: asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params as BookingIdParams;
    const booking = await BookingService.deleteBooking(id);

    res.status(200).json({
      success: true,
      message: "Booking cancelled successfully",
      data: booking,
    });
  }),

  getStatus: asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params as BookingIdParams;
    const status = await BookingService.getBookingStatus(id);

    res.status(200).json({
      success: true,
      message: "Booking status retrieved successfully",
      data: status,
    });
  }),

  updateStatus: asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params as BookingIdParams;
    const body = req.body as BookingStatusBody;
    const { status } = body;

    if (!status || !["pending", "confirmed", "completed", "cancelled"].includes(status)) {
      throw new HttpError(400, "Invalid status value");
    }

    const booking = await BookingService.updateBookingStatus(id, { status });

    res.status(200).json({
      success: true,
      message: "Booking status updated successfully",
      data: booking,
    });
  }),
};
