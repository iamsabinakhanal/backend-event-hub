import { ContactModel, IContact } from "../models/contact_model";

export class ContactRepository {
    async getAllContacts() {
        return await ContactModel.find().sort({ createdAt: -1 });
    }

    async getContactById(id: string) {
        return await ContactModel.findById(id);
    }

    async createContact(data: any) {
        const contact = new ContactModel(data);
        return await contact.save();
    }

    async updateContact(id: string, data: any) {
        return await ContactModel.findByIdAndUpdate(id, data, { new: true });
    }

    async deleteContact(id: string) {
        return await ContactModel.findByIdAndDelete(id);
    }

    async markAsReplied(id: string, reply_message: string) {
        return await ContactModel.findByIdAndUpdate(
            id,
            { replied: true, reply_message },
            { new: true }
        );
    }
}
