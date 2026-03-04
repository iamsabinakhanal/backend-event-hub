import { GalleryModel, IGallery } from "../models/gallery_model";

export class GalleryRepository {
    async getAllGalleryImages() {
        return await GalleryModel.find().sort({ createdAt: -1 });
    }

    async getGalleryImageById(id: string) {
        return await GalleryModel.findById(id);
    }

    async getGalleryImagesByCategory(category: string) {
        return await GalleryModel.find({ category }).sort({ createdAt: -1 });
    }

    async createGalleryImage(data: any) {
        const image = new GalleryModel(data);
        return await image.save();
    }

    async updateGalleryImage(id: string, data: any) {
        return await GalleryModel.findByIdAndUpdate(id, data, { new: true });
    }

    async deleteGalleryImage(id: string) {
        return await GalleryModel.findByIdAndDelete(id);
    }
}
