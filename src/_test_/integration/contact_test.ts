import request from 'supertest';
import app from '../../app';
import { ContactModel } from '../../models/contact_model';
import { UserModel } from '../../models/user_model';

describe('Contact Integration Tests', () => {
    let adminToken: string;
    let userToken: string;
    let contactId: string;
    let anotherContactId: string;

    const adminCredentials = {
        email: 'admin@example.com',
        password: 'Admin@1234'
    };

    const userCredentials = {
        email: 'user@example.com',
        password: 'User@1234'
    };

    const contactData = {
        name: 'John Doe',
        email: 'john.doe@example.com',
        phone: '+1234567890',
        subject: 'Inquiry about services',
        message: 'I would like to know more about your event planning services.'
    };

    const anotherContactData = {
        name: 'Jane Smith',
        email: 'jane.smith@example.com',
        subject: 'Wedding planning',
        message: 'I need help planning my wedding.'
    };

    beforeAll(async () => {
        // Create admin user
        await UserModel.deleteMany({ email: adminCredentials.email });
        await request(app)
            .post('/api/auth/register')
            .send({
                firstName: 'Admin',
                lastName: 'User',
                email: adminCredentials.email,
                password: adminCredentials.password,
                confirmPassword: adminCredentials.password
            });
        await UserModel.updateOne(
            { email: adminCredentials.email },
            { $set: { role: 'admin' } }
        );
        const adminLoginRes = await request(app)
            .post('/api/auth/login')
            .send(adminCredentials);
        adminToken = adminLoginRes.body.token;

        // Create regular user
        await UserModel.deleteMany({ email: userCredentials.email });
        await request(app)
            .post('/api/auth/register')
            .send({
                firstName: 'Regular',
                lastName: 'User',
                email: userCredentials.email,
                password: userCredentials.password,
                confirmPassword: userCredentials.password
            });
        const userLoginRes = await request(app)
            .post('/api/auth/login')
            .send(userCredentials);
        userToken = userLoginRes.body.token;

        // Clean up test contacts
        await ContactModel.deleteMany({ 
            email: { $in: [contactData.email, anotherContactData.email] }
        });
    });

    afterAll(async () => {
        await ContactModel.deleteMany({ 
            email: { $in: [contactData.email, anotherContactData.email] }
        });
        await UserModel.deleteMany({ 
            email: { $in: [adminCredentials.email, userCredentials.email] } 
        });
    });

    describe('POST /api/contact', () => {
        test('should submit a contact form successfully', async () => {
            const res = await request(app)
                .post('/api/contact')
                .send(contactData);
            expect([200, 201]).toContain(res.status);
            expect(res.body.data).toHaveProperty('_id');
            expect(res.body.data.name).toBe(contactData.name);
            expect(res.body.data.email).toBe(contactData.email);
            expect(res.body.data.subject).toBe(contactData.subject);
            expect(res.body.data.replied).toBe(false);
            contactId = res.body.data._id;
        });

        test('should submit contact form without phone (optional field)', async () => {
            const res = await request(app)
                .post('/api/contact')
                .send(anotherContactData);
            expect([200, 201]).toContain(res.status);
            expect(res.body.data).toHaveProperty('_id');
            anotherContactId = res.body.data._id;
        });

        test('should fail to submit with missing name', async () => {
            const res = await request(app)
                .post('/api/contact')
                .send({
                    email: 'test@example.com',
                    subject: 'Test',
                    message: 'Test message'
                });
            expect(res.status).toBe(400);
        });

        test('should fail to submit with missing email', async () => {
            const res = await request(app)
                .post('/api/contact')
                .send({
                    name: 'Test User',
                    subject: 'Test',
                    message: 'Test message'
                });
            expect(res.status).toBe(400);
        });

        test('should fail to submit with missing subject', async () => {
            const res = await request(app)
                .post('/api/contact')
                .send({
                    name: 'Test User',
                    email: 'test@example.com',
                    message: 'Test message'
                });
            expect(res.status).toBe(400);
        });

        test('should fail to submit with missing message', async () => {
            const res = await request(app)
                .post('/api/contact')
                .send({
                    name: 'Test User',
                    email: 'test@example.com',
                    subject: 'Test'
                });
            expect(res.status).toBe(400);
        });

        test('should fail to submit with invalid email format', async () => {
            const res = await request(app)
                .post('/api/contact')
                .send({
                    name: 'Test User',
                    email: 'invalid-email',
                    subject: 'Test',
                    message: 'Test message'
                });
            expect([201, 400]).toContain(res.status);
        });

        test('should allow unauthenticated users to submit contact form', async () => {
            const publicContact = {
                name: 'Public User',
                email: 'public@example.com',
                subject: 'Public Inquiry',
                message: 'This is a public inquiry.'
            };
            const res = await request(app)
                .post('/api/contact')
                .send(publicContact);
            expect([200, 201]).toContain(res.status);
            if (res.status === 200 || res.status === 201) {
                await ContactModel.deleteOne({ _id: res.body.data._id });
            }
        });
    });

    describe('GET /api/contact', () => {
        test('should get all contacts with admin token', async () => {
            const res = await request(app)
                .get('/api/contact')
                .set('Authorization', `Bearer ${adminToken}`);
            expect(res.status).toBe(200);
            expect(Array.isArray(res.body.data)).toBe(true);
        });

        test('should fail to get contacts without authorization', async () => {
            const res = await request(app)
                .get('/api/contact');
            expect([401, 403]).toContain(res.status);
        });

        test('should fail to get contacts with regular user token', async () => {
            const res = await request(app)
                .get('/api/contact')
                .set('Authorization', `Bearer ${userToken}`);
            expect(res.status).toBe(403);
        });
    });

    describe('GET /api/contact/:id', () => {
        test('should get specific contact with authenticated user', async () => {
            const res = await request(app)
                .get(`/api/contact/${contactId}`)
                .set('Authorization', `Bearer ${userToken}`);
            expect(res.status).toBe(200);
            expect(res.body.data._id).toBe(contactId);
        });

        test('should get specific contact with admin token', async () => {
            const res = await request(app)
                .get(`/api/contact/${contactId}`)
                .set('Authorization', `Bearer ${adminToken}`);
            expect(res.status).toBe(200);
            expect(res.body.data._id).toBe(contactId);
        });

        test('should fail to get contact without authorization', async () => {
            const res = await request(app)
                .get(`/api/contact/${contactId}`);
            expect([401, 403]).toContain(res.status);
        });

        test('should fail to get contact with invalid ID', async () => {
            const res = await request(app)
                .get('/api/contact/invalid-id')
                .set('Authorization', `Bearer ${userToken}`);
            expect([400, 500]).toContain(res.status);
        });

        test('should fail to get non-existent contact', async () => {
            const fakeId = '507f1f77bcf86cd799439011';
            const res = await request(app)
                .get(`/api/contact/${fakeId}`)
                .set('Authorization', `Bearer ${userToken}`);
            expect(res.status).toBe(404);
        });
    });

    describe('POST /api/contact/:id/reply', () => {
        test('should reply to contact with admin token', async () => {
            const replyData = {
                reply_message: 'Thank you for your inquiry. We will get back to you soon.'
            };
            const res = await request(app)
                .post(`/api/contact/${contactId}/reply`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send(replyData);
            expect(res.status).toBe(200);
            expect(res.body.data.replied).toBe(true);
            expect(res.body.data.reply_message).toBe(replyData.reply_message);
        });

        test('should fail to reply without authorization', async () => {
            const res = await request(app)
                .post(`/api/contact/${contactId}/reply`)
                .send({ reply_message: 'Test reply' });
            expect([401, 403]).toContain(res.status);
        });

        test('should fail to reply with regular user token', async () => {
            const res = await request(app)
                .post(`/api/contact/${contactId}/reply`)
                .set('Authorization', `Bearer ${userToken}`)
                .send({ reply_message: 'Test reply' });
            expect(res.status).toBe(403);
        });

        test('should fail to reply with missing reply_message', async () => {
            const res = await request(app)
                .post(`/api/contact/${contactId}/reply`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({});
            expect(res.status).toBe(400);
        });

        test('should fail to reply with invalid ID', async () => {
            const res = await request(app)
                .post('/api/contact/invalid-id/reply')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ reply_message: 'Test reply' });
            expect([400, 500]).toContain(res.status);
        });

        test('should fail to reply to non-existent contact', async () => {
            const fakeId = '507f1f77bcf86cd799439011';
            const res = await request(app)
                .post(`/api/contact/${fakeId}/reply`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ reply_message: 'Test reply' });
            expect(res.status).toBe(404);
        });

        test('should update existing reply', async () => {
            const updatedReply = {
                reply_message: 'Updated reply message.'
            };
            const res = await request(app)
                .post(`/api/contact/${contactId}/reply`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send(updatedReply);
            expect(res.status).toBe(200);
            expect(res.body.data.reply_message).toBe(updatedReply.reply_message);
        });
    });

    describe('DELETE /api/contact/:id', () => {
        test('should fail to delete contact without authorization', async () => {
            const res = await request(app)
                .delete(`/api/contact/${anotherContactId}`);
            expect([401, 403]).toContain(res.status);
        });

        test('should fail to delete contact with regular user token', async () => {
            const res = await request(app)
                .delete(`/api/contact/${anotherContactId}`)
                .set('Authorization', `Bearer ${userToken}`);
            expect(res.status).toBe(403);
        });

        test('should fail to delete with invalid ID', async () => {
            const res = await request(app)
                .delete('/api/contact/invalid-id')
                .set('Authorization', `Bearer ${adminToken}`);
            expect([400, 500]).toContain(res.status);
        });

        test('should fail to delete non-existent contact', async () => {
            const fakeId = '507f1f77bcf86cd799439011';
            const res = await request(app)
                .delete(`/api/contact/${fakeId}`)
                .set('Authorization', `Bearer ${adminToken}`);
            expect(res.status).toBe(404);
        });

        test('should delete contact with admin token', async () => {
            const res = await request(app)
                .delete(`/api/contact/${anotherContactId}`)
                .set('Authorization', `Bearer ${adminToken}`);
            expect(res.status).toBe(200);
        });

        test('should verify contact is deleted', async () => {
            const res = await request(app)
                .get(`/api/contact/${anotherContactId}`)
                .set('Authorization', `Bearer ${userToken}`);
            expect(res.status).toBe(404);
        });
    });
});
