import { FavoriteModel } from "../models/favorite_model";

export class FavoriteRepository {
    async getAllFavorites() {
        return await FavoriteModel.find()
            .populate('user_id')
            .populate('service_id')
            .sort({ createdAt: -1 });
    }

    async getFavoritesByUserId(userId: string) {
        return await FavoriteModel.find({ user_id: userId })
            .populate('service_id')
            .sort({ createdAt: -1 });
    }

    async getFavoriteById(id: string) {
        return await FavoriteModel.findById(id)
            .populate('user_id')
            .populate('service_id');
    }

    async getFavoriteByUserAndService(userId: string, serviceId: string) {
        return await FavoriteModel.findOne({ user_id: userId, service_id: serviceId });
    }

    async createFavorite(data: any) {
        const favorite = new FavoriteModel(data);
        return await favorite.save();
    }

    async updateFavorite(id: string, data: any) {
        return await FavoriteModel.findByIdAndUpdate(id, data, { new: true })
            .populate('user_id')
            .populate('service_id');
    }

    async deleteFavorite(id: string) {
        return await FavoriteModel.findByIdAndDelete(id);
    }
}
