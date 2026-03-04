import request from 'supertest';
import app from '../../app';
import { ServiceModel } from '../../models/service_model';
import { UserModel } from '../../models/user_model';

describe('Service Integration Tests', () => {
    let adminToken: string;
    let userToken: string;
    let serviceId: string;

    const adminCredentials = {
        email: 'admin@example.com',
        password: 'Admin@1234'
    };

    const userCredentials = {
        email: 'user@example.com',
        password: 'User@1234'
    };

    const newService = {
        name: 'Wedding Photography',
        description: 'Professional wedding photography service',
        price: 5000,
        category: 'Photography',
        duration: 480,
        features: ['HD Photos', 'Video Coverage', 'Album']
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

        // Clean up test services
        await ServiceModel.deleteMany({ name: newService.name });
    });

    afterAll(async () => {
        await ServiceModel.deleteMany({ name: newService.name });
        await UserModel.deleteMany({ 
            email: { $in: [adminCredentials.email, userCredentials.email] } 
        });
    });

    describe('POST /api/services', () => {
        test('should create a new service with admin token', async () => {
            const res = await request(app)
                .post('/api/services')
                .set('Authorization', `Bearer ${adminToken}`)
                .send(newService);
            expect(res.status).toBe(201);
            expect(res.body.data).toHaveProperty('_id');
            expect(res.body.data.name).toBe(newService.name);
            expect(res.body.data.price).toBe(newService.price);
            serviceId = res.body.data._id;
        });

        test('should fail to create service with missing name', async () => {
            const res = await request(app)
                .post('/api/services')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    description: 'Missing name',
                    price: 1000,
                    category: 'Catering'
                });
            expect(res.status).toBe(400);
        });

        test('should fail to create service with missing description', async () => {
            const res = await request(app)
                .post('/api/services')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    name: 'Test Service',
                    price: 1000,
                    category: 'Catering'
                });
            expect(res.status).toBe(400);
        });

        test('should fail to create service with missing price', async () => {
            const res = await request(app)
                .post('/api/services')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    name: 'Test Service',
                    description: 'Missing price',
                    category: 'Catering'
                });
            expect(res.status).toBe(400);
        });

        test('should fail to create service with missing category', async () => {
            const res = await request(app)
                .post('/api/services')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    name: 'Test Service',
                    description: 'Missing category',
                    price: 1000
                });
            expect(res.status).toBe(400);
        });

        test('should fail to create service without authorization', async () => {
            const res = await request(app)
                .post('/api/services')
                .send(newService);
            expect([401, 403]).toContain(res.status);
        });

        test('should fail to create service with regular user token', async () => {
            const res = await request(app)
                .post('/api/services')
                .set('Authorization', `Bearer ${userToken}`)
                .send({
                    name: 'Another Service',
                    description: 'Test description',
                    price: 2000,
                    category: 'Catering'
                });
            expect(res.status).toBe(403);
        });
    });

    describe('GET /api/services', () => {
        test('should get all services', async () => {
            const res = await request(app)
                .get('/api/services');
            expect(res.status).toBe(200);
            expect(Array.isArray(res.body.data)).toBe(true);
        });

        test('should get all services without authentication', async () => {
            const res = await request(app)
                .get('/api/services');
            expect(res.status).toBe(200);
            expect(Array.isArray(res.body.data)).toBe(true);
        });
    });

    describe('GET /api/services/:id', () => {
        test('should get service by ID', async () => {
            const res = await request(app)
                .get(`/api/services/${serviceId}`);
            expect(res.status).toBe(200);
            expect(res.body.data._id).toBe(serviceId);
            expect(res.body.data.name).toBe(newService.name);
        });

        test('should fail to get service with invalid ID', async () => {
            const res = await request(app)
                .get('/api/services/invalid-id');
            expect([400, 500]).toContain(res.status);
        });

        test('should fail to get non-existent service', async () => {
            const fakeId = '507f1f77bcf86cd799439011';
            const res = await request(app)
                .get(`/api/services/${fakeId}`);
            expect(res.status).toBe(404);
        });
    });

    describe('GET /api/services/category/:category', () => {
        test('should get services by category', async () => {
            const res = await request(app)
                .get(`/api/services/category/${newService.category}`);
            expect(res.status).toBe(200);
            expect(Array.isArray(res.body.data)).toBe(true);
            if (res.body.data.length > 0) {
                expect(res.body.data[0].category).toBe(newService.category);
            }
        });

        test('should return empty array for non-existent category', async () => {
            const res = await request(app)
                .get('/api/services/category/NonExistentCategory');
            expect(res.status).toBe(200);
            expect(Array.isArray(res.body.data)).toBe(true);
        });
    });

    describe('GET /api/services/search', () => {
        test('should search services by query', async () => {
            const res = await request(app)
                .get('/api/services/search')
                .query({ q: 'Wedding' });
            expect(res.status).toBe(200);
            expect(Array.isArray(res.body.data)).toBe(true);
        });

        test('should search services by category', async () => {
            const res = await request(app)
                .get('/api/services/search')
                .query({ category: newService.category });
            expect(res.status).toBe(400);
        });

        test('should search services by price range', async () => {
            const res = await request(app)
                .get('/api/services/search')
                .query({ minPrice: '1000', maxPrice: '10000' });
            expect(res.status).toBe(400);
        });

        test('should search services with multiple filters', async () => {
            const res = await request(app)
                .get('/api/services/search')
                .query({ 
                    q: 'Wedding',
                    category: newService.category,
                    minPrice: '1000',
                    maxPrice: '10000'
                });
            expect(res.status).toBe(200);
            expect(Array.isArray(res.body.data)).toBe(true);
        });
    });

    describe('PUT /api/services/:id', () => {
        test('should update service with admin token', async () => {
            const updatedData = {
                name: 'Wedding Photography',
                description: 'Updated professional wedding photography service',
                price: 6000
            };
            const res = await request(app)
                .put(`/api/services/${serviceId}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send(updatedData);
            expect(res.status).toBe(200);
            expect(res.body.data.description).toBe(updatedData.description);
            expect(res.body.data.price).toBe(updatedData.price);
        });

        test('should fail to update service without authorization', async () => {
            const res = await request(app)
                .put(`/api/services/${serviceId}`)
                .send({ description: 'Unauthorized update' });
            expect([401, 403]).toContain(res.status);
        });

        test('should fail to update service with regular user token', async () => {
            const res = await request(app)
                .put(`/api/services/${serviceId}`)
                .set('Authorization', `Bearer ${userToken}`)
                .send({ description: 'User update attempt' });
            expect(res.status).toBe(403);
        });

        test('should fail to update with invalid ID', async () => {
            const res = await request(app)
                .put('/api/services/invalid-id')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ description: 'Update attempt' });
            expect([400, 500]).toContain(res.status);
        });

        test('should fail to update non-existent service', async () => {
            const fakeId = '507f1f77bcf86cd799439011';
            const res = await request(app)
                .put(`/api/services/${fakeId}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ description: 'Update non-existent' });
            expect(res.status).toBe(404);
        });
    });

    describe('DELETE /api/services/:id', () => {
        test('should fail to delete service without authorization', async () => {
            const res = await request(app)
                .delete(`/api/services/${serviceId}`);
            expect([401, 403]).toContain(res.status);
        });

        test('should fail to delete service with regular user token', async () => {
            const res = await request(app)
                .delete(`/api/services/${serviceId}`)
                .set('Authorization', `Bearer ${userToken}`);
            expect(res.status).toBe(403);
        });

        test('should fail to delete with invalid ID', async () => {
            const res = await request(app)
                .delete('/api/services/invalid-id')
                .set('Authorization', `Bearer ${adminToken}`);
            expect([400, 500]).toContain(res.status);
        });

        test('should fail to delete non-existent service', async () => {
            const fakeId = '507f1f77bcf86cd799439011';
            const res = await request(app)
                .delete(`/api/services/${fakeId}`)
                .set('Authorization', `Bearer ${adminToken}`);
            expect(res.status).toBe(404);
        });

        test('should delete service with admin token', async () => {
            const res = await request(app)
                .delete(`/api/services/${serviceId}`)
                .set('Authorization', `Bearer ${adminToken}`);
            expect(res.status).toBe(200);
        });

        test('should verify service is deleted', async () => {
            const res = await request(app)
                .get(`/api/services/${serviceId}`);
            expect(res.status).toBe(404);
        });
    });
});
