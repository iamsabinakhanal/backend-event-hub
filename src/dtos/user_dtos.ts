import z from "zod";
import { UserSchema } from "../types/user_type";
// re-use UserSchema from types
export const CreateUserDTO = UserSchema.pick(
    {
        firstName: true,
        lastName: true,
        email: true,
        password: true
    }
).extend( // add new attribute to zod
    {
        confirmPassword: z.string().min(6)
    }
).refine( // extra validation for confirmPassword
    (data) => data.password === data.confirmPassword,
    {
        message: "Passwords do not match",
        path: ["confirmPassword"]
    }
)
export type CreateUserDTO = z.infer<typeof CreateUserDTO>;

export const LoginUserDTO = z.object({
    email: z.email(),
    password: z.string().min(6)
});
export type LoginUserDTO = z.infer<typeof LoginUserDTO>;

export const UpdateUserDTO = z.object({
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    email: z.email().optional(),
    password: z.string().min(6).optional(),
    image: z.string().optional(),
    role: z.enum(["user", "admin"]).optional()
});
export type UpdateUserDTO = z.infer<typeof UpdateUserDTO>;