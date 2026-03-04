import type { Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import type { AuthRequest } from "../middleware/auth";
import { FavoriteService } from "../services/favorite_service";
import { HttpError } from "../errors/http-errors";
import type {
  FavoriteCreateBody,
  FavoriteIdParams,
  FavoriteUpdateBody,
} from "../types/favorite_types";

const getOwnerId = (favorite: any): string => {
  const user = favorite?.user_id;
  if (!user) return "";
  if (typeof user === "string") return user;
  if (typeof user === "object" && user._id) return String(user._id);
  return String(user);
};

const assertFavoriteAccess = (authUser: AuthRequest["user"], favorite: any) => {
  if (!authUser?.id) {
    throw new HttpError(401, "Unauthorized");
  }

  if (authUser.role === "admin") {
    return;
  }

  const ownerId = getOwnerId(favorite);
  if (ownerId !== authUser.id) {
    throw new HttpError(403, "Access denied");
  }
};

export const FavoriteController = {
  getAll: asyncHandler(async (req: AuthRequest, res: Response) => {
    const authUser = req.user;
    if (!authUser?.id) {
      throw new HttpError(401, "Unauthorized");
    }

    const favorites =
      authUser.role === "admin"
        ? await FavoriteService.getAllFavorites()
        : await FavoriteService.getFavoritesByUserId(authUser.id);

    res.status(200).json({
      success: true,
      message: "Favorites retrieved successfully",
      data: favorites,
    });
  }),

  getById: asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params as FavoriteIdParams;
    const favorite = await FavoriteService.getFavoriteById(id);

    assertFavoriteAccess(req.user, favorite);

    res.status(200).json({
      success: true,
      message: "Favorite retrieved successfully",
      data: favorite,
    });
  }),

  create: asyncHandler(async (req: AuthRequest, res: Response) => {
    const authUser = req.user;
    if (!authUser?.id) {
      throw new HttpError(401, "Unauthorized");
    }

    if (!req.body || typeof req.body !== 'object') {
      throw new HttpError(400, "Request body is required. Make sure Content-Type is application/json");
    }

    const body = req.body as FavoriteCreateBody;
    const { service_id } = body;

    if (!service_id) {
      throw new HttpError(400, "service_id is required");
    }

    const favorite = await FavoriteService.createFavorite(authUser.id, { service_id });

    res.status(201).json({
      success: true,
      message: "Favorite created successfully",
      data: favorite,
    });
  }),

  update: asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params as FavoriteIdParams;
    const favorite = await FavoriteService.getFavoriteById(id);
    assertFavoriteAccess(req.user, favorite);

    if (!req.body || typeof req.body !== 'object') {
      throw new HttpError(400, "Request body is required. Make sure Content-Type is application/json");
    }

    const body = req.body as FavoriteUpdateBody;
    const { service_id } = body;

    if (!service_id) {
      throw new HttpError(400, "service_id is required");
    }

    const updatedFavorite = await FavoriteService.updateFavorite(id, { service_id });

    res.status(200).json({
      success: true,
      message: "Favorite updated successfully",
      data: updatedFavorite,
    });
  }),

  delete: asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params as FavoriteIdParams;
    const favorite = await FavoriteService.getFavoriteById(id);
    assertFavoriteAccess(req.user, favorite);

    const deletedFavorite = await FavoriteService.deleteFavorite(id);

    res.status(200).json({
      success: true,
      message: "Favorite deleted successfully",
      data: deletedFavorite,
    });
  }),
};
