import request from 'supertest';
import app from '../../app';
import { FavoriteModel } from '../../models/favorite_model';
import { ServiceModel } from '../../models/service_model';
import { UserModel } from '../../models/user_model';

describe('Favorite Integration Tests', () => {
    let userToken: string;
    let anotherUserToken: string;
    let serviceId: string;
    let anotherServiceId: string;
    let favoriteId: string;
    let userId: string;

    const userCredentials = {
        email: 'favoriteuser@example.com',
        password: 'User@1234'
    };

    const anotherUserCredentials = {
        email: 'anotheruser@example.com',
        password: 'User@1234'
    };

    const testService = {
        name: 'Test Service for Favorites',
        description: 'A test service',
        price: 1000,
        category: 'Testing',
        duration: 60
    };

    const anotherTestService = {
        name: 'Another Test Service',
        description: 'Another test service',
        price: 2000,
        category: 'Testing',
        duration: 90
    };

    beforeAll(async () => {
        // Create first user
        await UserModel.deleteMany({ email: userCredentials.email });
        const userRegRes = await request(app)
            .post('/api/auth/register')
            .send({
                firstName: 'Favorite',
                lastName: 'User',
                email: userCredentials.email,
                password: userCredentials.password,
                confirmPassword: userCredentials.password
            });
        const userLoginRes = await request(app)
            .post('/api/auth/login')
            .send(userCredentials);
        userToken = userLoginRes.body.token;
        
        // Get user ID
        const userDoc = await UserModel.findOne({ email: userCredentials.email });
        userId = userDoc?._id.toString() || '';

        // Create second user
        await UserModel.deleteMany({ email: anotherUserCredentials.email });
        await request(app)
            .post('/api/auth/register')
            .send({
                firstName: 'Another',
                lastName: 'User',
                email: anotherUserCredentials.email,
                password: anotherUserCredentials.password,
                confirmPassword: anotherUserCredentials.password
            });
        const anotherUserLoginRes = await request(app)
            .post('/api/auth/login')
            .send(anotherUserCredentials);
        anotherUserToken = anotherUserLoginRes.body.token;

        // Create test services
        await ServiceModel.deleteMany({ name: { $in: [testService.name, anotherTestService.name] } });
        const service1 = await ServiceModel.create(testService);
        serviceId = service1._id.toString();
        const service2 = await ServiceModel.create(anotherTestService);
        anotherServiceId = service2._id.toString();

        // Clean up test favorites
        await FavoriteModel.deleteMany({ user_id: userId });
    });

    afterAll(async () => {
        await FavoriteModel.deleteMany({ user_id: userId });
        await ServiceModel.deleteMany({ name: { $in: [testService.name, anotherTestService.name] } });
        await UserModel.deleteMany({ 
            email: { $in: [userCredentials.email, anotherUserCredentials.email] } 
        });
    });

    describe('POST /api/favorites', () => {
        test('should add a service to favorites', async () => {
            const res = await request(app)
                .post('/api/favorites')
                .set('Authorization', `Bearer ${userToken}`)
                .send({ service_id: serviceId });
            expect([200, 201]).toContain(res.status);
            expect(res.body.data).toHaveProperty('_id');
            expect(res.body.data.service_id).toBe(serviceId);
            favoriteId = res.body.data._id;
        });

        test('should fail to add favorite with missing service_id', async () => {
            const res = await request(app)
                .post('/api/favorites')
                .set('Authorization', `Bearer ${userToken}`)
                .send({});
            expect(res.status).toBe(400);
        });

        test('should fail to add favorite with invalid service_id', async () => {
            const res = await request(app)
                .post('/api/favorites')
                .set('Authorization', `Bearer ${userToken}`)
                .send({ service_id: 'invalid-id' });
            expect([400, 500]).toContain(res.status);
        });

        test('should fail to add favorite with non-existent service_id', async () => {
            const fakeServiceId = '507f1f77bcf86cd799439011';
            const res = await request(app)
                .post('/api/favorites')
                .set('Authorization', `Bearer ${userToken}`)
                .send({ service_id: fakeServiceId });
            expect([400, 404]).toContain(res.status);
        });

        test('should fail to add duplicate favorite', async () => {
            const res = await request(app)
                .post('/api/favorites')
                .set('Authorization', `Bearer ${userToken}`)
                .send({ service_id: serviceId });
            expect([400, 409]).toContain(res.status);
        });

        test('should fail to add favorite without authorization', async () => {
            const res = await request(app)
                .post('/api/favorites')
                .send({ service_id: anotherServiceId });
            expect([401, 403]).toContain(res.status);
        });

        test('should allow different users to favorite the same service', async () => {
            const res = await request(app)
                .post('/api/favorites')
                .set('Authorization', `Bearer ${anotherUserToken}`)
                .send({ service_id: serviceId });
            expect([200, 201]).toContain(res.status);
            if (res.status === 201 || res.status === 200) {
                await FavoriteModel.deleteOne({ _id: res.body.data._id });
            }
        });

        test('should allow same user to favorite different services', async () => {
            const res = await request(app)
                .post('/api/favorites')
                .set('Authorization', `Bearer ${userToken}`)
                .send({ service_id: anotherServiceId });
            expect([200, 201]).toContain(res.status);
            if (res.status === 201 || res.status === 200) {
                await FavoriteModel.deleteOne({ _id: res.body.data._id });
            }
        });
    });

    describe('GET /api/favorites', () => {
        test('should get all favorites for the authenticated user', async () => {
            const res = await request(app)
                .get('/api/favorites')
                .set('Authorization', `Bearer ${userToken}`);
            expect(res.status).toBe(200);
            expect(Array.isArray(res.body.data)).toBe(true);
        });

        test('should fail to get favorites without authorization', async () => {
            const res = await request(app)
                .get('/api/favorites');
            expect([401, 403]).toContain(res.status);
        });

        test('should only return favorites belonging to the authenticated user', async () => {
            const res = await request(app)
                .get('/api/favorites')
                .set('Authorization', `Bearer ${userToken}`);
            expect(res.status).toBe(200);
            if (res.body.data.length > 0) {
                res.body.data.forEach((favorite: any) => {
                    expect(favorite.user_id).toBe(userId);
                });
            }
        });
    });

    describe('GET /api/favorites/:id', () => {
        test('should get a specific favorite by ID', async () => {
            const res = await request(app)
                .get(`/api/favorites/${favoriteId}`)
                .set('Authorization', `Bearer ${userToken}`);
            expect(res.status).toBe(200);
            expect(res.body.data._id).toBe(favoriteId);
        });

        test('should fail to get favorite with invalid ID', async () => {
            const res = await request(app)
                .get('/api/favorites/invalid-id')
                .set('Authorization', `Bearer ${userToken}`);
            expect([400, 500]).toContain(res.status);
        });

        test('should fail to get non-existent favorite', async () => {
            const fakeId = '507f1f77bcf86cd799439011';
            const res = await request(app)
                .get(`/api/favorites/${fakeId}`)
                .set('Authorization', `Bearer ${userToken}`);
            expect(res.status).toBe(404);
        });

        test('should fail to get favorite without authorization', async () => {
            const res = await request(app)
                .get(`/api/favorites/${favoriteId}`);
            expect([401, 403]).toContain(res.status);
        });

        test('should fail to get another user\'s favorite', async () => {
            const res = await request(app)
                .get(`/api/favorites/${favoriteId}`)
                .set('Authorization', `Bearer ${anotherUserToken}`);
            expect([403, 404]).toContain(res.status);
        });
    });

    describe('PUT /api/favorites/:id', () => {
        test('should update favorite with new service_id', async () => {
            const res = await request(app)
                .put(`/api/favorites/${favoriteId}`)
                .set('Authorization', `Bearer ${userToken}`)
                .send({ service_id: anotherServiceId });
            expect(res.status).toBe(200);
            const returnedServiceId = typeof res.body.data.service_id === 'string'
                ? res.body.data.service_id
                : res.body.data.service_id?._id;
            expect(returnedServiceId).toBe(anotherServiceId);
        });

        test('should fail to update favorite without authorization', async () => {
            const res = await request(app)
                .put(`/api/favorites/${favoriteId}`)
                .send({ service_id: serviceId });
            expect([401, 403]).toContain(res.status);
        });

        test('should fail to update another user\'s favorite', async () => {
            const res = await request(app)
                .put(`/api/favorites/${favoriteId}`)
                .set('Authorization', `Bearer ${anotherUserToken}`)
                .send({ service_id: serviceId });
            expect([403, 404]).toContain(res.status);
        });

        test('should fail to update with invalid ID', async () => {
            const res = await request(app)
                .put('/api/favorites/invalid-id')
                .set('Authorization', `Bearer ${userToken}`)
                .send({ service_id: serviceId });
            expect([400, 500]).toContain(res.status);
        });

        test('should fail to update non-existent favorite', async () => {
            const fakeId = '507f1f77bcf86cd799439011';
            const res = await request(app)
                .put(`/api/favorites/${fakeId}`)
                .set('Authorization', `Bearer ${userToken}`)
                .send({ service_id: serviceId });
            expect(res.status).toBe(404);
        });

        test('should fail to update with invalid service_id', async () => {
            const res = await request(app)
                .put(`/api/favorites/${favoriteId}`)
                .set('Authorization', `Bearer ${userToken}`)
                .send({ service_id: 'invalid-id' });
            expect([400, 500]).toContain(res.status);
        });
    });

    describe('DELETE /api/favorites/:id', () => {
        test('should fail to delete favorite without authorization', async () => {
            const res = await request(app)
                .delete(`/api/favorites/${favoriteId}`);
            expect([401, 403]).toContain(res.status);
        });

        test('should fail to delete another user\'s favorite', async () => {
            const res = await request(app)
                .delete(`/api/favorites/${favoriteId}`)
                .set('Authorization', `Bearer ${anotherUserToken}`);
            expect([403, 404]).toContain(res.status);
        });

        test('should fail to delete with invalid ID', async () => {
            const res = await request(app)
                .delete('/api/favorites/invalid-id')
                .set('Authorization', `Bearer ${userToken}`);
            expect([400, 500]).toContain(res.status);
        });

        test('should fail to delete non-existent favorite', async () => {
            const fakeId = '507f1f77bcf86cd799439011';
            const res = await request(app)
                .delete(`/api/favorites/${fakeId}`)
                .set('Authorization', `Bearer ${userToken}`);
            expect(res.status).toBe(404);
        });

        test('should delete favorite successfully', async () => {
            const res = await request(app)
                .delete(`/api/favorites/${favoriteId}`)
                .set('Authorization', `Bearer ${userToken}`);
            expect(res.status).toBe(200);
        });

        test('should verify favorite is deleted', async () => {
            const res = await request(app)
                .get(`/api/favorites/${favoriteId}`)
                .set('Authorization', `Bearer ${userToken}`);
            expect(res.status).toBe(404);
        });
    });
});
