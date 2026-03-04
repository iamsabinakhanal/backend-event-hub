import { z } from "zod";

export const CreateBookingDTO = z.object({
    service_id: z.string().min(1, "Service ID is required"),
    event_date: z.string().datetime("Invalid date format"),
    guest_count: z.number().min(1, "Guest count must be at least 1"),
    special_requests: z.string().optional(),
    total_price: z.number().min(0, "Total price must be non-negative"),
}).refine((data) => {
    const eventDate = new Date(data.event_date);
    const now = new Date();
    return eventDate > now;
}, {
    message: "Event date cannot be in the past",
    path: ["event_date"],
});

export const UpdateBookingDTO = z.object({
    event_date: z.string().datetime("Invalid date format").optional(),
    guest_count: z.number().min(1, "Guest count must be at least 1").optional(),
    special_requests: z.string().optional(),
    total_price: z.number().min(0, "Total price must be non-negative").optional(),
}).refine((data) => {
    if (!data.event_date) return true;
    const eventDate = new Date(data.event_date);
    const now = new Date();
    return eventDate > now;
}, {
    message: "Event date cannot be in the past",
    path: ["event_date"],
});

export const UpdateBookingStatusDTO = z.object({
    status: z.enum(['pending', 'confirmed', 'completed', 'cancelled']),
});

export type CreateBookingDTO = z.infer<typeof CreateBookingDTO>;
export type UpdateBookingDTO = z.infer<typeof UpdateBookingDTO>;
export type UpdateBookingStatusDTO = z.infer<typeof UpdateBookingStatusDTO>;
