import mongoose, { Document, Schema } from "mongoose";

interface ContactType {
    name: string;
    email: string;
    phone?: string;
    subject: string;
    message: string;
    replied?: boolean;
    reply_message?: string;
}

const ContactSchema: Schema = new Schema<ContactType>(
    {
        name: { type: String, required: true, trim: true },
        email: { type: String, required: true, trim: true, lowercase: true },
        phone: { type: String, trim: true },
        subject: { type: String, required: true, trim: true },
        message: { type: String, required: true },
        replied: { type: Boolean, default: false },
        reply_message: { type: String },
    },
    {
        timestamps: true,
    }
);

export interface IContact extends ContactType, Document {
    _id: mongoose.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

export const ContactModel = mongoose.model<IContact>('Contact', ContactSchema);
