import mongoose, { Document, Schema } from "mongoose";

interface GalleryType {
    title: string;
    description?: string;
    image_url: string;
    category: string;
}

const GallerySchema: Schema = new Schema<GalleryType>(
    {
        title: { type: String, required: true, trim: true },
        description: { type: String, trim: true },
        image_url: { type: String, required: true },
        category: { type: String, required: true, trim: true },
    },
    {
        timestamps: true,
    }
);

export interface IGallery extends GalleryType, Document {
    _id: mongoose.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

export const GalleryModel = mongoose.model<IGallery>('Gallery', GallerySchema);
