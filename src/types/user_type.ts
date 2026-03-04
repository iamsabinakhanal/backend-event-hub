import z from "zod";

export const UserSchema = z.object({
    email: z.email(),
    password: z.string().min(6),
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    image: z.string().optional(),
    role: z.enum(["user", "admin"]).default("user"),
    resetToken: z.string().optional(),
    resetTokenExpiry: z.date().optional(),
});

export type UserType = z.infer<typeof UserSchema>;