import type { Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import type { AuthRequest } from "../middleware/auth";
import { GalleryService } from "../services/gallery_service";
import { toPublicUploadUrl } from "../utils/file";
import { HttpError } from "../errors/http-errors";
import type {
  GalleryCategoryParams,
  GalleryCreateBody,
  GalleryIdParams,
  GalleryUpdateBody,
} from "../types/gallery_types";

export const GalleryController = {
  listAll: asyncHandler(async (_req: AuthRequest, res: Response) => {
    const images = await GalleryService.getAllGalleryImages();
    res.status(200).json({
      success: true,
      message: "Gallery images retrieved successfully",
      data: images,
    });
  }),

  getById: asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params as GalleryIdParams;
    const image = await GalleryService.getGalleryImageById(id);
    
    res.status(200).json({
      success: true,
      message: "Gallery image retrieved successfully",
      data: image,
    });
  }),

  create: asyncHandler(async (req: AuthRequest, res: Response) => {
    const uploadedFile = req.file;
    if (!uploadedFile) {
      throw new HttpError(400, "Image file is required");
    }

    const imageUrl = toPublicUploadUrl(uploadedFile.path);
    const body = req.body as GalleryCreateBody;
    const title = typeof body.title === "string" ? body.title : undefined;
    const description = typeof body.description === "string" ? body.description : undefined;
    const category = typeof body.category === "string" ? body.category : undefined;

    if (!title || !category) {
      throw new HttpError(400, "Missing required fields: title, category");
    }

    const image = await GalleryService.uploadGalleryImage({
      title,
      description,
      category,
      image_url: imageUrl,
    }, uploadedFile);

    res.status(201).json({
      success: true,
      message: "Gallery image uploaded successfully",
      data: image,
    });
  }),

  update: asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params as GalleryIdParams;
    const body = req.body as GalleryUpdateBody;
    const title = typeof body.title === "string" ? body.title : undefined;
    const description = typeof body.description === "string" ? body.description : undefined;
    const category = typeof body.category === "string" ? body.category : undefined;

    let imageUrl: string | undefined;
    if (req.file) {
      imageUrl = toPublicUploadUrl(req.file.path);
    }

    const image = await GalleryService.updateGalleryImage(id, {
      title,
      description,
      category,
      image_url: imageUrl,
    }, req.file);

    res.status(200).json({
      success: true,
      message: "Gallery image updated successfully",
      data: image,
    });
  }),

  delete: asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params as GalleryIdParams;
    const image = await GalleryService.deleteGalleryImage(id);

    res.status(200).json({
      success: true,
      message: "Gallery image deleted successfully",
      data: image,
    });
  }),

  getByCategory: asyncHandler(async (req: AuthRequest, res: Response) => {
    const { category } = req.params as GalleryCategoryParams;
    const images = await GalleryService.getGalleryImagesByCategory(category);

    res.status(200).json({
      success: true,
      message: "Gallery images retrieved successfully",
      data: images,
    });
  }),
};
