import { ServiceModel, IService } from "../models/service_model";

export class ServiceRepository {
    async getAllServices() {
        return await ServiceModel.find().sort({ createdAt: -1 });
    }

    async getServiceById(id: string) {
        return await ServiceModel.findById(id);
    }

    async getServicesByCategory(category: string) {
        return await ServiceModel.find({ category }).sort({ createdAt: -1 });
    }

    async searchServices(query: string, minPrice?: number, maxPrice?: number, category?: string) {
        let filter: any = {
            $or: [
                { name: { $regex: query, $options: 'i' } },
                { description: { $regex: query, $options: 'i' } },
            ]
        };

        if (minPrice !== undefined) filter.price = { $gte: minPrice };
        if (maxPrice !== undefined) filter.price = { ...filter.price, $lte: maxPrice };
        if (category) filter.category = category;

        return await ServiceModel.find(filter).sort({ createdAt: -1 });
    }

    async createService(data: any) {
        const service = new ServiceModel(data);
        return await service.save();
    }

    async updateService(id: string, data: any) {
        return await ServiceModel.findByIdAndUpdate(id, data, { new: true });
    }

    async deleteService(id: string) {
        return await ServiceModel.findByIdAndDelete(id);
    }

    async getServiceByName(name: string) {
        return await ServiceModel.findOne({ name });
    }
}
