import z from "zod";
import { UserSchema } from "../types/user_type"; // ensure filename is correct

// ------------------- REGISTER DTO -------------------
export const CreateUserSchema = UserSchema.pick({
    firstName: true,
    lastName: true,
    email: true,
    username: true,
    password: true,
}).extend({
    confirmPassword: z.string()
}).refine(
    (data) => data.password === data.confirmPassword,
    {
        message: "Passwords do not match",
        path: ["confirmPassword"],
    }
);

export type CreateUserDTO = z.infer<typeof CreateUserSchema>;

// ------------------- LOGIN DTO -------------------
export const LoginUserSchema = z.object({
    email: z.string().email("Invalid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
});

export type LoginUserDTO = z.infer<typeof LoginUserSchema>;
