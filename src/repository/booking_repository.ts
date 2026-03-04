import { BookingModel, IBooking } from "../models/booking_model";
import mongoose from "mongoose";

export class BookingRepository {
    async getAllBookings() {
        return await BookingModel.find()
            .populate('user_id')
            .populate('service_id')
            .sort({ createdAt: -1 });
    }

    async getBookingsByUserId(userId: string) {
        return await BookingModel.find({ user_id: userId })
            .populate('service_id')
            .sort({ createdAt: -1 });
    }

    async getBookingsByServiceId(serviceId: string) {
        return await BookingModel.find({ service_id: serviceId })
            .populate('user_id')
            .sort({ createdAt: -1 });
    }

    async getBookingById(id: string) {
        return await BookingModel.findById(id)
            .populate('user_id')
            .populate('service_id');
    }

    async createBooking(data: any) {
        const booking = new BookingModel(data);
        return await booking.save();
    }

    async updateBooking(id: string, data: any) {
        return await BookingModel.findByIdAndUpdate(id, data, { new: true })
            .populate('user_id')
            .populate('service_id');
    }

    async deleteBooking(id: string) {
        return await BookingModel.findByIdAndDelete(id);
    }

    async updateBookingStatus(id: string, status: string) {
        return await BookingModel.findByIdAndUpdate(
            id,
            { status },
            { new: true }
        ).populate('user_id').populate('service_id');
    }
}
