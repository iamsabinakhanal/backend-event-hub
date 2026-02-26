import { ServiceRepository } from "../repository/service_repository";
import { CreateServiceDTO, UpdateServiceDTO } from "../dtos/service_dtos";
import { HttpError } from "../errors/http-errors";
import fs from "fs";

const serviceRepository = new ServiceRepository();

export class ServiceService {
    static async getAllServices() {
        return await serviceRepository.getAllServices();
    }

    static async getServiceById(id: string) {
        const service = await serviceRepository.getServiceById(id);
        if (!service) {
            throw new HttpError(404, "Service not found");
        }
        return service;
    }

    static async getServicesByCategory(category: string) {
        return await serviceRepository.getServicesByCategory(category);
    }

    static async searchServices(query: string, minPrice?: number, maxPrice?: number, category?: string) {
        if (!query || query.trim() === '') {
            throw new HttpError(400, "Search query is required");
        }
        return await serviceRepository.searchServices(query, minPrice, maxPrice, category);
    }

    static async createService(data: CreateServiceDTO, file?: Express.Multer.File) {
        // Check if service with same name already exists
        const existingService = await serviceRepository.getServiceByName(data.name);
        if (existingService) {
            if (file) fs.unlinkSync(file.path);
            throw new HttpError(409, "Service with this name already exists");
        }

        let serviceData = { ...data };
        if (file) {
            serviceData.image_url = `/uploads/services/${file.filename}`;
            console.log('[ServiceService.createService] Image uploaded:', {
                filename: file.filename,
                path: file.path,
                image_url: serviceData.image_url
            });
        }

        return await serviceRepository.createService(serviceData);
    }

    static async updateService(id: string, data: UpdateServiceDTO, file?: Express.Multer.File) {
        const service = await serviceRepository.getServiceById(id);
        if (!service) {
            if (file) fs.unlinkSync(file.path);
            throw new HttpError(404, "Service not found");
        }

        let updateData = { ...data };
        if (file) {
            // Delete old image if it exists
            if (service.image_url) {
                const oldImagePath = service.image_url.replace('/uploads/', '');
                const fullPath = `uploads/${oldImagePath}`;
                try {
                    fs.unlinkSync(fullPath);
                } catch (err) {
                    console.error("Error deleting old image:", err);
                }
            }
            updateData.image_url = `/uploads/services/${file.filename}`;
        }

        return await serviceRepository.updateService(id, updateData);
    }

    static async deleteService(id: string) {
        const service = await serviceRepository.getServiceById(id);
        if (!service) {
            throw new HttpError(404, "Service not found");
        }

        // Delete image file
        if (service.image_url) {
            const imagePath = service.image_url.replace('/uploads/', '');
            const fullPath = `uploads/${imagePath}`;
            try {
                fs.unlinkSync(fullPath);
            } catch (err) {
                console.error("Error deleting image:", err);
            }
        }

        return await serviceRepository.deleteService(id);
    }
}
