import { FavoriteRepository } from "../repository/favorite_repository";
import { ServiceRepository } from "../repository/service_repository";
import { CreateFavoriteDTO, UpdateFavoriteDTO } from "../dtos/favorite_dtos";
import { HttpError } from "../errors/http-errors";

const favoriteRepository = new FavoriteRepository();
const serviceRepository = new ServiceRepository();

export class FavoriteService {
    static async getAllFavorites() {
        return await favoriteRepository.getAllFavorites();
    }

    static async getFavoritesByUserId(userId: string) {
        return await favoriteRepository.getFavoritesByUserId(userId);
    }

    static async getFavoriteById(id: string) {
        const favorite = await favoriteRepository.getFavoriteById(id);
        if (!favorite) {
            throw new HttpError(404, "Favorite not found");
        }
        return favorite;
    }

    static async createFavorite(userId: string, data: CreateFavoriteDTO) {
        const service = await serviceRepository.getServiceById(data.service_id);
        if (!service) {
            throw new HttpError(404, "Service not found");
        }

        const existingFavorite = await favoriteRepository.getFavoriteByUserAndService(userId, data.service_id);
        if (existingFavorite) {
            throw new HttpError(409, "Service is already in favorites");
        }

        return await favoriteRepository.createFavorite({
            user_id: userId,
            service_id: data.service_id,
        });
    }

    static async updateFavorite(id: string, data: UpdateFavoriteDTO) {
        const favorite = await favoriteRepository.getFavoriteById(id);
        if (!favorite) {
            throw new HttpError(404, "Favorite not found");
        }

        if (data.service_id) {
            const service = await serviceRepository.getServiceById(data.service_id);
            if (!service) {
                throw new HttpError(404, "Service not found");
            }
        }

        return await favoriteRepository.updateFavorite(id, data);
    }

    static async deleteFavorite(id: string) {
        const favorite = await favoriteRepository.getFavoriteById(id);
        if (!favorite) {
            throw new HttpError(404, "Favorite not found");
        }

        return await favoriteRepository.deleteFavorite(id);
    }
}
