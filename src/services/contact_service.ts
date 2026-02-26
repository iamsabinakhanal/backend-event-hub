import { ContactRepository } from "../repository/contact_repository";
import { CreateContactDTO, ReplyContactDTO } from "../dtos/contact_dtos";
import { HttpError } from "../errors/http-errors";

const contactRepository = new ContactRepository();

export class ContactService {
    static async getAllContacts() {
        return await contactRepository.getAllContacts();
    }

    static async getContactById(id: string) {
        const contact = await contactRepository.getContactById(id);
        if (!contact) {
            throw new HttpError(404, "Contact not found");
        }
        return contact;
    }

    static async submitContact(data: CreateContactDTO) {
        return await contactRepository.createContact(data);
    }

    static async deleteContact(id: string) {
        const contact = await contactRepository.getContactById(id);
        if (!contact) {
            throw new HttpError(404, "Contact not found");
        }
        return await contactRepository.deleteContact(id);
    }

    static async replyToContact(id: string, data: ReplyContactDTO) {
        const contact = await contactRepository.getContactById(id);
        if (!contact) {
            throw new HttpError(404, "Contact not found");
        }
        return await contactRepository.markAsReplied(id, data.reply_message);
    }
}
