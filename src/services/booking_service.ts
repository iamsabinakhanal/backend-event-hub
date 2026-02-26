import { BookingRepository } from "../repository/booking_repository";
import { CreateBookingDTO, UpdateBookingDTO, UpdateBookingStatusDTO } from "../dtos/booking_dtos";
import { HttpError } from "../errors/http-errors";

const bookingRepository = new BookingRepository();

export class BookingService {
    static async getAllBookings() {
        return await bookingRepository.getAllBookings();
    }

    static async getBookingsByUserId(userId: string) {
        return await bookingRepository.getBookingsByUserId(userId);
    }

    static async getBookingsByServiceId(serviceId: string) {
        return await bookingRepository.getBookingsByServiceId(serviceId);
    }

    static async getBookingById(id: string) {
        const booking = await bookingRepository.getBookingById(id);
        if (!booking) {
            throw new HttpError(404, "Booking not found");
        }
        return booking;
    }

    static async createBooking(userId: string, data: CreateBookingDTO) {
        const bookingData = {
            user_id: userId,
            service_id: data.service_id,
            event_date: data.event_date,
            guest_count: data.guest_count,
            special_requests: data.special_requests,
            total_price: data.total_price,
            status: 'pending',
        };
        return await bookingRepository.createBooking(bookingData);
    }

    static async updateBooking(id: string, data: UpdateBookingDTO) {
        const booking = await bookingRepository.getBookingById(id);
        if (!booking) {
            throw new HttpError(404, "Booking not found");
        }
        return await bookingRepository.updateBooking(id, data);
    }

    static async deleteBooking(id: string) {
        const booking = await bookingRepository.getBookingById(id);
        if (!booking) {
            throw new HttpError(404, "Booking not found");
        }
        return await bookingRepository.deleteBooking(id);
    }

    static async getBookingStatus(id: string) {
        const booking = await bookingRepository.getBookingById(id);
        if (!booking) {
            throw new HttpError(404, "Booking not found");
        }
        return { status: booking.status };
    }

    static async updateBookingStatus(id: string, data: UpdateBookingStatusDTO) {
        const booking = await bookingRepository.getBookingById(id);
        if (!booking) {
            throw new HttpError(404, "Booking not found");
        }
        return await bookingRepository.updateBookingStatus(id, data.status);
    }
}
