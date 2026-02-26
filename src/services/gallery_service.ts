import { GalleryRepository } from "../repository/gallery_repository";
import { CreateGalleryDTO, UpdateGalleryDTO } from "../dtos/gallery_dtos";
import { HttpError } from "../errors/http-errors";
import { toPublicUploadUrl } from "../utils/file";
import fs from "fs";
import path from "path";

const galleryRepository = new GalleryRepository();

const normalizeGalleryImageUrl = (imageUrl?: string): string | undefined => {
    if (!imageUrl) return imageUrl;
    if (imageUrl.startsWith("/uploads/gallery/")) return imageUrl;
    if (imageUrl.startsWith("/uploads/")) {
        const filename = imageUrl.replace("/uploads/", "");
        return `/uploads/gallery/${filename}`;
    }
    return imageUrl;
};

const getUploadFilePath = (imageUrl: string): string => {
    const cleaned = imageUrl.replace(/^\//, "");
    return path.join(__dirname, "..", "..", cleaned);
};

export class GalleryService {
    static async getAllGalleryImages() {
        const images = await galleryRepository.getAllGalleryImages();
        return images.map(image => ({
            ...image,
            image_url: normalizeGalleryImageUrl(image.image_url),
        }));
    }

    static async getGalleryImageById(id: string) {
        const image = await galleryRepository.getGalleryImageById(id);
        if (!image) {
            throw new HttpError(404, "Gallery image not found");
        }
        return {
            ...image,
            image_url: normalizeGalleryImageUrl(image.image_url),
        };
    }

    static async getGalleryImagesByCategory(category: string) {
        const images = await galleryRepository.getGalleryImagesByCategory(category);
        return images.map(image => ({
            ...image,
            image_url: normalizeGalleryImageUrl(image.image_url),
        }));
    }

    static async uploadGalleryImage(data: CreateGalleryDTO, file: Express.Multer.File) {
        if (!file) {
            throw new HttpError(400, "Image file is required");
        }
        
        // Use the image_url from data if provided, otherwise create one
        const imageData = {
            ...data,
            image_url: data.image_url || toPublicUploadUrl(file.path),
        };
        return await galleryRepository.createGalleryImage(imageData);
    }

    static async updateGalleryImage(id: string, data: UpdateGalleryDTO, file?: Express.Multer.File) {
        const image = await galleryRepository.getGalleryImageById(id);
        if (!image) {
            throw new HttpError(404, "Gallery image not found");
        }

        let updateData = { ...data };
        if (file) {
            // Delete old image if it exists
            if (image.image_url) {
                try {
                    const oldImagePath = getUploadFilePath(normalizeGalleryImageUrl(image.image_url) || image.image_url);
                    if (fs.existsSync(oldImagePath)) {
                        fs.unlinkSync(oldImagePath);
                    }
                } catch (err) {
                    console.error("Error deleting old image:", err);
                }
            }
            updateData.image_url = data.image_url || toPublicUploadUrl(file.path);
        }

        return await galleryRepository.updateGalleryImage(id, updateData);
    }

    static async deleteGalleryImage(id: string) {
        const image = await galleryRepository.getGalleryImageById(id);
        if (!image) {
            throw new HttpError(404, "Gallery image not found");
        }

        // Delete image file
        if (image.image_url) {
            try {
                const imagePath = getUploadFilePath(normalizeGalleryImageUrl(image.image_url) || image.image_url);
                if (fs.existsSync(imagePath)) {
                    fs.unlinkSync(imagePath);
                }
            } catch (err) {
                console.error("Error deleting image:", err);
            }
        }

        return await galleryRepository.deleteGalleryImage(id);
    }
}
