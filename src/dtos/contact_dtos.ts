import { z } from "zod";

export const CreateContactDTO = z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Invalid email address"),
    phone: z.string().optional(),
    subject: z.string().min(5, "Subject must be at least 5 characters"),
    message: z.string().min(10, "Message must be at least 10 characters"),
});

export const ReplyContactDTO = z.object({
    reply_message: z.string().min(5, "Reply must be at least 5 characters"),
});

export type CreateContactDTO = z.infer<typeof CreateContactDTO>;
export type ReplyContactDTO = z.infer<typeof ReplyContactDTO>;
