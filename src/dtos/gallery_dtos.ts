import { z } from "zod";

export const CreateGalleryDTO = z.object({
    title: z.string().min(3, "Title must be at least 3 characters"),
    description: z.string().optional(),
    category: z.string().min(2, "Category must be at least 2 characters"),
    image_url: z.string().optional(),
});

export const UpdateGalleryDTO = z.object({
    title: z.string().min(3, "Title must be at least 3 characters").optional(),
    description: z.string().optional(),
    category: z.string().min(2, "Category must be at least 2 characters").optional(),
    image_url: z.string().optional(),
});

export type CreateGalleryDTO = z.infer<typeof CreateGalleryDTO>;
export type UpdateGalleryDTO = z.infer<typeof UpdateGalleryDTO>;
