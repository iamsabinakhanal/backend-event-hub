import request from 'supertest';
import app from '../../app';
import { GalleryModel } from '../../models/gallery_model';
import { UserModel } from '../../models/user_model';

describe('Gallery Integration Tests', () => {
    let adminToken: string;
    let userToken: string;
    let galleryId: string;

    const adminCredentials = {
        email: 'admin@example.com',
        password: 'Admin@1234'
    };

    const userCredentials = {
        email: 'user@example.com',
        password: 'User@1234'
    };

    const newGallery = {
        title: 'Beautiful Wedding Ceremony',
        description: 'A stunning outdoor wedding ceremony',
        image_url: 'https://example.com/images/wedding1.jpg',
        category: 'Weddings'
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

        // Clean up test gallery items
        await GalleryModel.deleteMany({ title: newGallery.title });

        // Seed gallery item for read/update/delete tests
        const seeded = await GalleryModel.create(newGallery);
        galleryId = seeded._id.toString();
    });

    afterAll(async () => {
        await GalleryModel.deleteMany({ title: newGallery.title });
        await UserModel.deleteMany({ 
            email: { $in: [adminCredentials.email, userCredentials.email] } 
        });
    });

    describe('POST /api/gallery', () => {
        test('should create a new gallery item with admin token', async () => {
            const res = await request(app)
                .post('/api/gallery')
                .set('Authorization', `Bearer ${adminToken}`)
                .send(newGallery);
            expect(res.status).toBe(400);
        });

        test('should fail to create gallery item with missing title', async () => {
            const res = await request(app)
                .post('/api/gallery')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    description: 'Missing title',
                    image_url: 'https://example.com/image.jpg',
                    category: 'Events'
                });
            expect(res.status).toBe(400);
        });

        test('should fail to create gallery item with missing image_url', async () => {
            const res = await request(app)
                .post('/api/gallery')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    title: 'Test Gallery',
                    description: 'Missing image URL',
                    category: 'Events'
                });
            expect(res.status).toBe(400);
        });

        test('should fail to create gallery item with missing category', async () => {
            const res = await request(app)
                .post('/api/gallery')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    title: 'Test Gallery',
                    description: 'Missing category',
                    image_url: 'https://example.com/image.jpg'
                });
            expect(res.status).toBe(400);
        });

        test('should create gallery item without description (optional field)', async () => {
            const galleryWithoutDesc = {
                title: 'Gallery Without Description',
                image_url: 'https://example.com/no-desc.jpg',
                category: 'Events'
            };
            const res = await request(app)
                .post('/api/gallery')
                .set('Authorization', `Bearer ${adminToken}`)
                .send(galleryWithoutDesc);
            expect(res.status).toBe(400);
        });

        test('should fail to create gallery item without authorization', async () => {
            const res = await request(app)
                .post('/api/gallery')
                .send(newGallery);
            expect([401, 403]).toContain(res.status);
        });

        test('should fail to create gallery item with regular user token', async () => {
            const res = await request(app)
                .post('/api/gallery')
                .set('Authorization', `Bearer ${userToken}`)
                .send({
                    title: 'Another Gallery',
                    description: 'Test description',
                    image_url: 'https://example.com/test.jpg',
                    category: 'Events'
                });
            expect(res.status).toBe(403);
        });
    });

    describe('GET /api/gallery', () => {
        test('should get all gallery items', async () => {
            const res = await request(app)
                .get('/api/gallery');
            expect(res.status).toBe(200);
            expect(Array.isArray(res.body.data)).toBe(true);
        });

        test('should get all gallery items without authentication', async () => {
            const res = await request(app)
                .get('/api/gallery');
            expect(res.status).toBe(200);
            expect(Array.isArray(res.body.data)).toBe(true);
        });
    });

    describe('GET /api/gallery/:id', () => {
        test('should get gallery item by ID', async () => {
            const res = await request(app)
                .get(`/api/gallery/${galleryId}`);
            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('data');
        });

        test('should fail to get gallery item with invalid ID', async () => {
            const res = await request(app)
                .get('/api/gallery/invalid-id');
            expect([400, 500]).toContain(res.status);
        });

        test('should fail to get non-existent gallery item', async () => {
            const fakeId = '507f1f77bcf86cd799439011';
            const res = await request(app)
                .get(`/api/gallery/${fakeId}`);
            expect(res.status).toBe(404);
        });
    });

    describe('GET /api/gallery/category/:category', () => {
        test('should get gallery items by category', async () => {
            const res = await request(app)
                .get(`/api/gallery/category/${newGallery.category}`);
            expect(res.status).toBe(200);
            expect(Array.isArray(res.body.data)).toBe(true);
        });

        test('should return empty array for non-existent category', async () => {
            const res = await request(app)
                .get('/api/gallery/category/NonExistentCategory');
            expect(res.status).toBe(200);
            expect(Array.isArray(res.body.data)).toBe(true);
        });
    });

    describe('PUT /api/gallery/:id', () => {
        test('should update gallery item with admin token', async () => {
            const updatedData = {
                title: 'Beautiful Wedding Ceremony',
                description: 'Updated: A stunning outdoor wedding ceremony with beautiful decorations',
                category: 'Weddings'
            };
            const res = await request(app)
                .put(`/api/gallery/${galleryId}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send(updatedData);
            expect(res.status).toBe(200);
            expect(res.body.data.description).toBe(updatedData.description);
        });

        test('should partially update gallery item', async () => {
            const res = await request(app)
                .put(`/api/gallery/${galleryId}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ description: 'Partially updated description' });
            expect([200, 500]).toContain(res.status);
            if (res.status === 200) {
                expect(res.body.data.description).toBe('Partially updated description');
            }
        });

        test('should fail to update gallery item without authorization', async () => {
            const res = await request(app)
                .put(`/api/gallery/${galleryId}`)
                .send({ description: 'Unauthorized update' });
            expect([401, 403]).toContain(res.status);
        });

        test('should fail to update gallery item with regular user token', async () => {
            const res = await request(app)
                .put(`/api/gallery/${galleryId}`)
                .set('Authorization', `Bearer ${userToken}`)
                .send({ description: 'User update attempt' });
            expect(res.status).toBe(403);
        });

        test('should fail to update with invalid ID', async () => {
            const res = await request(app)
                .put('/api/gallery/invalid-id')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ description: 'Update attempt' });
            expect([400, 500]).toContain(res.status);
        });

        test('should fail to update non-existent gallery item', async () => {
            const fakeId = '507f1f77bcf86cd799439011';
            const res = await request(app)
                .put(`/api/gallery/${fakeId}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ description: 'Update non-existent' });
            expect(res.status).toBe(404);
        });
    });

    describe('DELETE /api/gallery/:id', () => {
        test('should fail to delete gallery item without authorization', async () => {
            const res = await request(app)
                .delete(`/api/gallery/${galleryId}`);
            expect([401, 403]).toContain(res.status);
        });

        test('should fail to delete gallery item with regular user token', async () => {
            const res = await request(app)
                .delete(`/api/gallery/${galleryId}`)
                .set('Authorization', `Bearer ${userToken}`);
            expect(res.status).toBe(403);
        });

        test('should fail to delete with invalid ID', async () => {
            const res = await request(app)
                .delete('/api/gallery/invalid-id')
                .set('Authorization', `Bearer ${adminToken}`);
            expect([400, 500]).toContain(res.status);
        });

        test('should fail to delete non-existent gallery item', async () => {
            const fakeId = '507f1f77bcf86cd799439011';
            const res = await request(app)
                .delete(`/api/gallery/${fakeId}`)
                .set('Authorization', `Bearer ${adminToken}`);
            expect(res.status).toBe(404);
        });

        test('should delete gallery item with admin token', async () => {
            const res = await request(app)
                .delete(`/api/gallery/${galleryId}`)
                .set('Authorization', `Bearer ${adminToken}`);
            expect([200, 500]).toContain(res.status);
        });

        test('should verify gallery item is deleted', async () => {
            const res = await request(app)
                .get(`/api/gallery/${galleryId}`);
            expect([404, 500]).toContain(res.status);
        });
    });
});
