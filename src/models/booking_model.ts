import mongoose, { Document, Schema } from "mongoose";

interface BookingType {
    user_id: mongoose.Types.ObjectId;
    service_id: mongoose.Types.ObjectId;
    event_date: Date;
    guest_count: number;
    special_requests?: string;
    total_price: number;
    status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
}

const BookingSchema: Schema = new Schema<BookingType>(
    {
        user_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        service_id: { type: Schema.Types.ObjectId, ref: 'Service', required: true },
        event_date: { type: Date, required: true },
        guest_count: { type: Number, required: true, min: 1 },
        special_requests: { type: String },
        total_price: { type: Number, required: true, min: 0 },
        status: {
            type: String,
            enum: ['pending', 'confirmed', 'completed', 'cancelled'],
            default: 'pending',
        },
    },
    {
        timestamps: true,
    }
);

export interface IBooking extends BookingType, Document {
    _id: mongoose.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

export const BookingModel = mongoose.model<IBooking>('Booking', BookingSchema);
