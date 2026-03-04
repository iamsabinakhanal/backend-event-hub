import mongoose, { Document, Schema } from "mongoose";

interface FavoriteType {
    user_id: mongoose.Types.ObjectId;
    service_id: mongoose.Types.ObjectId;
}

const FavoriteSchema: Schema = new Schema<FavoriteType>(
    {
        user_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        service_id: { type: Schema.Types.ObjectId, ref: 'Service', required: true },
    },
    {
        timestamps: true,
    }
);

FavoriteSchema.index({ user_id: 1, service_id: 1 }, { unique: true });

export interface IFavorite extends FavoriteType, Document {
    _id: mongoose.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

export const FavoriteModel = mongoose.model<IFavorite>('Favorite', FavoriteSchema);
