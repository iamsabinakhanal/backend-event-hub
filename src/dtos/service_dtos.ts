import { z } from "zod";

export const CreateServiceDTO = z.object({
    name: z.string().min(3, "Name must be at least 3 characters"),
    description: z.string().min(10, "Description must be at least 10 characters"),
    price: z.number().min(0, "Price must be non-negative"),
    category: z.string().min(2, "Category must be at least 2 characters"),
    image_url: z.string().optional(),
    duration: z.number().optional(),
    features: z.array(z.string()).optional(),
});

export const UpdateServiceDTO = z.object({
    name: z.string().min(3, "Name must be at least 3 characters").optional(),
    description: z.string().min(10, "Description must be at least 10 characters").optional(),
    price: z.number().min(0, "Price must be non-negative").optional(),
    category: z.string().min(2, "Category must be at least 2 characters").optional(),
    duration: z.number().optional(),
    image_url: z.string().optional(),
    features: z.array(z.string()).optional(),
});

export type CreateServiceDTO = z.infer<typeof CreateServiceDTO>;
export type UpdateServiceDTO = z.infer<typeof UpdateServiceDTO>;
