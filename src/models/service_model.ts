import mongoose, { Document, Schema } from "mongoose";

interface ServiceType {
    name: string;
    description: string;
    price: number;
    category: string;
    image_url?: string;
    duration?: number;
    features?: string[];
}

const ServiceSchema: Schema = new Schema<ServiceType>(
    {
        name: { type: String, required: true, trim: true, unique: true },
        description: { type: String, required: true },
        price: { type: Number, required: true, min: 0 },
        category: { type: String, required: true, trim: true },
        image_url: { type: String },
        duration: { type: Number }, // duration in minutes
        features: { type: [String], default: [] },
    },
    {
        timestamps: true,
    }
);

export interface IService extends ServiceType, Document {
    _id: mongoose.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

export const ServiceModel = mongoose.model<IService>('Service', ServiceSchema);
