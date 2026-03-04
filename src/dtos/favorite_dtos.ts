import { z } from "zod";

export const CreateFavoriteDTO = z.object({
    service_id: z.string().min(1, "service_id is required"),
});

export const UpdateFavoriteDTO = z.object({
    service_id: z.string().min(1, "service_id is required").optional(),
});

export type CreateFavoriteDTO = z.infer<typeof CreateFavoriteDTO>;
export type UpdateFavoriteDTO = z.infer<typeof UpdateFavoriteDTO>;
