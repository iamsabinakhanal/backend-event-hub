import { userInfo } from 'node:os';
import z from 'zod';
import { UserSchema } from '../types/user_type';

export const CreateUserDTO = UserSchema.pick(
    {
        username: true,
        email: true,
        password: true,
        firstName: true,
        lastName: true,
        role: true
    }
).extend(
    {
        confirmPassword: z.string().min(6)
    }
).refine(
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