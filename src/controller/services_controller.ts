import type { Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import type { AuthRequest } from "../middleware/auth";
import { ServiceService } from "../services/service_service";
import { BookingService } from "../services/booking_service";
import { HttpError } from "../errors/http-errors";
import type {
  ServiceCategoryParams,
  ServiceCreateBody,
  ServiceIdParams,
  ServiceSearchQuery,
  ServiceUpdateBody,
} from "../types/service_types";

export const ServiceController = {
  listAll: asyncHandler(async (_req: AuthRequest, res: Response) => {
    const services = await ServiceService.getAllServices();
    res.status(200).json({
      success: true,
      message: "Services retrieved successfully",
      data: services,
    });
  }),

  getById: asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params as ServiceIdParams;
    const service = await ServiceService.getServiceById(id);

    res.status(200).json({
      success: true,
      message: "Service retrieved successfully",
      data: service,
    });
  }),

  create: asyncHandler(async (req: AuthRequest, res: Response) => {
    const uploadedFile = req.file;
    
    const body = req.body as ServiceCreateBody;
    const { name, description, price, category, duration, features } = body;

    if (!name || !description || !price || !category) {
      throw new HttpError(400, "Missing required fields: name, description, price, category");
    }

    const service = await ServiceService.createService(
      {
        name,
        description,
        price: Number(price),
        category,
        duration: duration ? Number(duration) : undefined,
        features: features ? (typeof features === "string" ? features.split(",") : features) : [],
      },
      uploadedFile
    );

    res.status(201).json({
      success: true,
      message: "Service created successfully",
      data: service,
    });
  }),

  update: asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params as ServiceIdParams;
    const body = req.body as ServiceUpdateBody;
    const { name, description, price, category, duration, features } = body;

    const service = await ServiceService.updateService(
      id,
      {
        name,
        description,
        price: price ? Number(price) : undefined,
        category,
        duration: duration ? Number(duration) : undefined,
        features: features ? (typeof features === "string" ? features.split(",") : features) : undefined,
      },
      req.file
    );

    res.status(200).json({
      success: true,
      message: "Service updated successfully",
      data: service,
    });
  }),

  delete: asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params as ServiceIdParams;
    const service = await ServiceService.deleteService(id);

    res.status(200).json({
      success: true,
      message: "Service deleted successfully",
      data: service,
    });
  }),

  getByCategory: asyncHandler(async (req: AuthRequest, res: Response) => {
    const { category } = req.params as ServiceCategoryParams;
    const services = await ServiceService.getServicesByCategory(category);

    res.status(200).json({
      success: true,
      message: "Services retrieved successfully",
      data: services,
    });
  }),

  search: asyncHandler(async (req: AuthRequest, res: Response) => {
    const query = req.query as ServiceSearchQuery;
    const { q, minPrice, maxPrice, category } = query;

    if (!q || typeof q !== "string") {
      throw new HttpError(400, "Search query is required");
    }

    const services = await ServiceService.searchServices(
      q,
      minPrice ? Number(minPrice) : undefined,
      maxPrice ? Number(maxPrice) : undefined,
      typeof category === "string" ? category : undefined
    );

    res.status(200).json({
      success: true,
      message: "Services retrieved successfully",
      data: services,
    });
  }),

  getServiceBookings: asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params as ServiceIdParams;
    
    // First verify the service exists
    await ServiceService.getServiceById(id);
    
    // Get all bookings for this service
    const bookings = await BookingService.getBookingsByServiceId(id);

    res.status(200).json({
      success: true,
      message: "Service bookings retrieved successfully",
      data: bookings,
    });
  }),
};
