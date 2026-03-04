export type BookingIdParams = {
  id: string;
};

export type BookingCreateBody = {
  service_id: string;
  event_date: string;
  guest_count: number | string;
  special_requests?: string;
  total_price: number | string;
};

export type BookingUpdateBody = {
  event_date?: string;
  guest_count?: number | string;
  special_requests?: string;
  total_price?: number | string;
};

export type BookingStatusBody = {
  status: "pending" | "confirmed" | "completed" | "cancelled";
};
