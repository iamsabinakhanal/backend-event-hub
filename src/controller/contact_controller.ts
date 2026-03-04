import type { Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import type { AuthRequest } from "../middleware/auth";
import { ContactService } from "../services/contact_service";
import { HttpError } from "../errors/http-errors";
import type { ContactCreateBody, ContactIdParams, ContactReplyBody } from "../types/contact_types";

export const ContactController = {
  getAll: asyncHandler(async (_req: AuthRequest, res: Response) => {
    const contacts = await ContactService.getAllContacts();
    res.status(200).json({
      success: true,
      message: "Contacts retrieved successfully",
      data: contacts,
    });
  }),

  getById: asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params as ContactIdParams;
    const contact = await ContactService.getContactById(id);
    
    res.status(200).json({
      success: true,
      message: "Contact retrieved successfully",
      data: contact,
    });
  }),

  submit: asyncHandler(async (req: AuthRequest, res: Response) => {
    const body = req.body as ContactCreateBody;
    const { name, email, phone, subject, message } = body;

    if (!name || !email || !subject || !message) {
      throw new HttpError(400, "Missing required fields: name, email, subject, message");
    }

    const contact = await ContactService.submitContact({
      name,
      email,
      phone,
      subject,
      message,
    });

    res.status(201).json({
      success: true,
      message: "Contact message submitted successfully",
      data: contact,
    });
  }),

  delete: asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params as ContactIdParams;
    const contact = await ContactService.deleteContact(id);

    res.status(200).json({
      success: true,
      message: "Contact deleted successfully",
      data: contact,
    });
  }),

  reply: asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params as ContactIdParams;
    const body = req.body as ContactReplyBody;
    const { reply_message } = body;

    if (!reply_message) {
      throw new HttpError(400, "Reply message is required");
    }

    const contact = await ContactService.replyToContact(id, { reply_message });

    res.status(200).json({
      success: true,
      message: "Reply sent successfully",
      data: contact,
    });
  }),
};
