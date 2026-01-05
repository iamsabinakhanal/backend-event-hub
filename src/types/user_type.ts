import z from "zod";

/**
 * UserSchema
 * Base schema representing a User in Event-Hub
 * Can be re-used in DTOs and validation
 */
export const UserSchema = z.object({
    username: z.string().min(1, "Username is required"), // cannot be empty
    email: z.string().email("Invalid email address"),    // must be a valid email
    password: z.string().min(6, "Password must be at least 6 characters"), // minimum 6 chars
    firstName: z.string().optional(), // optional field
    lastName: z.string().optional(),  // optional field
    role: z.enum(["user", "admin"]).default("user"), // role defaults to 'user'
});

// TypeScript type inferred from Zod schema
export type UserType = z.infer<typeof UserSchema>;
