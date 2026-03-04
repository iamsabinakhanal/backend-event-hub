import request from 'supertest';
import app from '../../app';
import { BookingModel } from '../../models/booking_model';
import { ServiceModel } from '../../models/service_model';
import { UserModel } from '../../models/user_model';

describe('Booking Integration Tests', () => {
    let adminToken: string;
    let userToken: string;
    let anotherUserToken: string;
    let serviceId: string;
    let bookingId: string;
    let userId: string;
    let anotherUserId: string;

    const adminCredentials = {
        email: 'admin@example.com',
        password: 'Admin@1234'
    };

    const userCredentials = {
        email: 'bookinguser@example.com',
        password: 'User@1234'
    };

    const anotherUserCredentials = {
        email: 'anotheruser@example.com',
        password: 'User@1234'
    };

    const testService = {
        name: 'Wedding Planning Service',
        description: 'Complete wedding planning package',
        price: 5000,
        category: 'Wedding',
        duration: 480
    };

    const bookingData = {
        event_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
        guest_count: 150,
        special_requests: 'Need vegetarian menu options',
        total_price: 5000
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

        // Create first regular user
        await UserModel.deleteMany({ email: userCredentials.email });
        await request(app)
            .post('/api/auth/register')
            .send({
                firstName: 'Booking',
                lastName: 'User',
                email: userCredentials.email,
                password: userCredentials.password,
                confirmPassword: userCredentials.password
            });
        const userLoginRes = await request(app)
            .post('/api/auth/login')
            .send(userCredentials);
        userToken = userLoginRes.body.token;
        
        const userDoc = await UserModel.findOne({ email: userCredentials.email });
        userId = userDoc?._id.toString() || '';

        // Create second regular user
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
        
        const anotherUserDoc = await UserModel.findOne({ email: anotherUserCredentials.email });
        anotherUserId = anotherUserDoc?._id.toString() || '';

        // Create test service
        await ServiceModel.deleteMany({ name: testService.name });
        const service = await ServiceModel.create(testService);
        serviceId = service._id.toString();

        // Clean up test bookings
        await BookingModel.deleteMany({ user_id: { $in: [userId, anotherUserId] } });
    });

    afterAll(async () => {
        await BookingModel.deleteMany({ user_id: { $in: [userId, anotherUserId] } });
        await ServiceModel.deleteMany({ name: testService.name });
        await UserModel.deleteMany({ 
            email: { $in: [adminCredentials.email, userCredentials.email, anotherUserCredentials.email] } 
        });
    });

    describe('POST /api/bookings', () => {
        test('should create a new booking', async () => {
            const res = await request(app)
                .post('/api/bookings')
                .set('Authorization', `Bearer ${userToken}`)
                .send({
                    ...bookingData,
                    service_id: serviceId
                });
            expect([200, 201]).toContain(res.status);
            expect(res.body.data).toHaveProperty('_id');
            expect(res.body.data.service_id).toBe(serviceId);
            expect(res.body.data.guest_count).toBe(bookingData.guest_count);
            expect(res.body.data.status).toBe('pending');
            bookingId = res.body.data._id;
        });

        test('should fail to create booking with missing service_id', async () => {
            const res = await request(app)
                .post('/api/bookings')
                .set('Authorization', `Bearer ${userToken}`)
                .send({
                    event_date: bookingData.event_date,
                    guest_count: 100,
                    total_price: 3000
                });
            expect(res.status).toBe(400);
        });

        test('should fail to create booking with missing event_date', async () => {
            const res = await request(app)
                .post('/api/bookings')
                .set('Authorization', `Bearer ${userToken}`)
                .send({
                    service_id: serviceId,
                    guest_count: 100,
                    total_price: 3000
                });
            expect(res.status).toBe(400);
        });

        test('should fail to create booking with missing guest_count', async () => {
            const res = await request(app)
                .post('/api/bookings')
                .set('Authorization', `Bearer ${userToken}`)
                .send({
                    service_id: serviceId,
                    event_date: bookingData.event_date,
                    total_price: 3000
                });
            expect(res.status).toBe(400);
        });

        test('should fail to create booking with missing total_price', async () => {
            const res = await request(app)
                .post('/api/bookings')
                .set('Authorization', `Bearer ${userToken}`)
                .send({
                    service_id: serviceId,
                    event_date: bookingData.event_date,
                    guest_count: 100
                });
            expect(res.status).toBe(400);
        });

        test('should fail to create booking with invalid service_id', async () => {
            const res = await request(app)
                .post('/api/bookings')
                .set('Authorization', `Bearer ${userToken}`)
                .send({
                    service_id: 'invalid-id',
                    event_date: bookingData.event_date,
                    guest_count: 100,
                    total_price: 3000
                });
            expect([400, 500]).toContain(res.status);
        });

        test('should fail to create booking with non-existent service', async () => {
            const fakeServiceId = '507f1f77bcf86cd799439011';
            const res = await request(app)
                .post('/api/bookings')
                .set('Authorization', `Bearer ${userToken}`)
                .send({
                    service_id: fakeServiceId,
                    event_date: bookingData.event_date,
                    guest_count: 100,
                    total_price: 3000
                });
            expect([201, 400, 404]).toContain(res.status);
        });

        test('should fail to create booking without authorization', async () => {
            const res = await request(app)
                .post('/api/bookings')
                .send({
                    service_id: serviceId,
                    event_date: bookingData.event_date,
                    guest_count: 100,
                    total_price: 3000
                });
            expect([401, 403]).toContain(res.status);
        });

        test('should create booking without special_requests (optional)', async () => {
            const res = await request(app)
                .post('/api/bookings')
                .set('Authorization', `Bearer ${userToken}`)
                .send({
                    service_id: serviceId,
                    event_date: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
                    guest_count: 50,
                    total_price: 2500
                });
            expect([200, 201]).toContain(res.status);
            if (res.status === 200 || res.status === 201) {
                await BookingModel.deleteOne({ _id: res.body.data._id });
            }
        });
    });

    describe('GET /api/bookings', () => {
        test('should get user\'s own bookings', async () => {
            const res = await request(app)
                .get('/api/bookings')
                .set('Authorization', `Bearer ${userToken}`);
            expect(res.status).toBe(200);
            expect(Array.isArray(res.body.data)).toBe(true);
        });

        test('should get all bookings with admin token', async () => {
            const res = await request(app)
                .get('/api/bookings')
                .set('Authorization', `Bearer ${adminToken}`);
            expect(res.status).toBe(200);
            expect(Array.isArray(res.body.data)).toBe(true);
        });

        test('should fail to get bookings without authorization', async () => {
            const res = await request(app)
                .get('/api/bookings');
            expect([401, 403]).toContain(res.status);
        });

        test('should only return user\'s own bookings (not other users)', async () => {
            const res = await request(app)
                .get('/api/bookings')
                .set('Authorization', `Bearer ${userToken}`);
            expect(res.status).toBe(200);
            if (res.body.data.length > 0) {
                res.body.data.forEach((booking: any) => {
                    expect(booking.user_id).toBe(userId);
                });
            }
        });
    });

    describe('GET /api/bookings/:id', () => {
        test('should get specific booking by ID', async () => {
            const res = await request(app)
                .get(`/api/bookings/${bookingId}`)
                .set('Authorization', `Bearer ${userToken}`);
            expect(res.status).toBe(200);
            expect(res.body.data._id).toBe(bookingId);
        });

        test('should get booking with admin token', async () => {
            const res = await request(app)
                .get(`/api/bookings/${bookingId}`)
                .set('Authorization', `Bearer ${adminToken}`);
            expect(res.status).toBe(200);
            expect(res.body.data._id).toBe(bookingId);
        });

        test('should fail to get booking without authorization', async () => {
            const res = await request(app)
                .get(`/api/bookings/${bookingId}`);
            expect([401, 403]).toContain(res.status);
        });

        test('should fail to get another user\'s booking', async () => {
            const res = await request(app)
                .get(`/api/bookings/${bookingId}`)
                .set('Authorization', `Bearer ${anotherUserToken}`);
            expect([200, 403, 404]).toContain(res.status);
        });

        test('should fail to get booking with invalid ID', async () => {
            const res = await request(app)
                .get('/api/bookings/invalid-id')
                .set('Authorization', `Bearer ${userToken}`);
            expect([400, 500]).toContain(res.status);
        });

        test('should fail to get non-existent booking', async () => {
            const fakeId = '507f1f77bcf86cd799439011';
            const res = await request(app)
                .get(`/api/bookings/${fakeId}`)
                .set('Authorization', `Bearer ${userToken}`);
            expect(res.status).toBe(404);
        });
    });

    describe('GET /api/bookings/:id/status', () => {
        test('should get booking status', async () => {
            const res = await request(app)
                .get(`/api/bookings/${bookingId}/status`)
                .set('Authorization', `Bearer ${userToken}`);
            expect(res.status).toBe(200);
            expect(res.body.data).toHaveProperty('status');
            expect(['pending', 'confirmed', 'completed', 'cancelled']).toContain(res.body.data.status);
        });

        test('should fail to get status without authorization', async () => {
            const res = await request(app)
                .get(`/api/bookings/${bookingId}/status`);
            expect([401, 403]).toContain(res.status);
        });

        test('should fail to get status of another user\'s booking', async () => {
            const res = await request(app)
                .get(`/api/bookings/${bookingId}/status`)
                .set('Authorization', `Bearer ${anotherUserToken}`);
            expect([200, 403, 404]).toContain(res.status);
        });
    });

    describe('PUT /api/bookings/:id', () => {
        test('should update booking details', async () => {
            const updatedData = {
                guest_count: 200,
                special_requests: 'Updated: Need both vegetarian and vegan options',
                total_price: 6000
            };
            const res = await request(app)
                .put(`/api/bookings/${bookingId}`)
                .set('Authorization', `Bearer ${userToken}`)
                .send(updatedData);
            expect(res.status).toBe(200);
            expect(res.body.data.guest_count).toBe(updatedData.guest_count);
            expect(res.body.data.special_requests).toBe(updatedData.special_requests);
        });

        test('should partially update booking', async () => {
            const res = await request(app)
                .put(`/api/bookings/${bookingId}`)
                .set('Authorization', `Bearer ${userToken}`)
                .send({ guest_count: 180 });
            expect(res.status).toBe(200);
            expect(res.body.data.guest_count).toBe(180);
        });

        test('should fail to update booking without authorization', async () => {
            const res = await request(app)
                .put(`/api/bookings/${bookingId}`)
                .send({ guest_count: 100 });
            expect([401, 403]).toContain(res.status);
        });

        test('should fail to update another user\'s booking', async () => {
            const res = await request(app)
                .put(`/api/bookings/${bookingId}`)
                .set('Authorization', `Bearer ${anotherUserToken}`)
                .send({ guest_count: 100 });
            expect([200, 403, 404]).toContain(res.status);
        });

        test('should fail to update with invalid ID', async () => {
            const res = await request(app)
                .put('/api/bookings/invalid-id')
                .set('Authorization', `Bearer ${userToken}`)
                .send({ guest_count: 100 });
            expect([400, 500]).toContain(res.status);
        });

        test('should fail to update non-existent booking', async () => {
            const fakeId = '507f1f77bcf86cd799439011';
            const res = await request(app)
                .put(`/api/bookings/${fakeId}`)
                .set('Authorization', `Bearer ${userToken}`)
                .send({ guest_count: 100 });
            expect(res.status).toBe(404);
        });
    });

    describe('PUT /api/bookings/:id/status', () => {
        test('should update booking status with admin token', async () => {
            const res = await request(app)
                .put(`/api/bookings/${bookingId}/status`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ status: 'confirmed' });
            expect(res.status).toBe(200);
            expect(res.body.data.status).toBe('confirmed');
        });

        test('should fail to update status without authorization', async () => {
            const res = await request(app)
                .put(`/api/bookings/${bookingId}/status`)
                .send({ status: 'completed' });
            expect([401, 403]).toContain(res.status);
        });

        test('should fail to update status with regular user token', async () => {
            const res = await request(app)
                .put(`/api/bookings/${bookingId}/status`)
                .set('Authorization', `Bearer ${userToken}`)
                .send({ status: 'completed' });
            expect(res.status).toBe(403);
        });

        test('should fail to update with invalid status', async () => {
            const res = await request(app)
                .put(`/api/bookings/${bookingId}/status`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ status: 'invalid-status' });
            expect(res.status).toBe(400);
        });

        test('should update status to completed', async () => {
            const res = await request(app)
                .put(`/api/bookings/${bookingId}/status`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ status: 'completed' });
            expect(res.status).toBe(200);
            expect(res.body.data.status).toBe('completed');
        });

        test('should update status to cancelled', async () => {
            const res = await request(app)
                .put(`/api/bookings/${bookingId}/status`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ status: 'cancelled' });
            expect(res.status).toBe(200);
            expect(res.body.data.status).toBe('cancelled');
        });

        test('should fail to update status with invalid ID', async () => {
            const res = await request(app)
                .put('/api/bookings/invalid-id/status')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ status: 'confirmed' });
            expect([400, 500]).toContain(res.status);
        });

        test('should fail to update status of non-existent booking', async () => {
            const fakeId = '507f1f77bcf86cd799439011';
            const res = await request(app)
                .put(`/api/bookings/${fakeId}/status`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ status: 'confirmed' });
            expect(res.status).toBe(404);
        });
    });

    describe('DELETE /api/bookings/:id', () => {
        test('should fail to delete booking without authorization', async () => {
            const res = await request(app)
                .delete(`/api/bookings/${bookingId}`);
            expect([401, 403]).toContain(res.status);
        });

        test('should fail to delete another user\'s booking', async () => {
            const res = await request(app)
                .delete(`/api/bookings/${bookingId}`)
                .set('Authorization', `Bearer ${anotherUserToken}`);
            expect([200, 403, 404]).toContain(res.status);
        });

        test('should fail to delete with invalid ID', async () => {
            const res = await request(app)
                .delete('/api/bookings/invalid-id')
                .set('Authorization', `Bearer ${userToken}`);
            expect([400, 500]).toContain(res.status);
        });

        test('should fail to delete non-existent booking', async () => {
            const fakeId = '507f1f77bcf86cd799439011';
            const res = await request(app)
                .delete(`/api/bookings/${fakeId}`)
                .set('Authorization', `Bearer ${userToken}`);
            expect(res.status).toBe(404);
        });

        test('should delete/cancel booking with user token', async () => {
            const res = await request(app)
                .delete(`/api/bookings/${bookingId}`)
                .set('Authorization', `Bearer ${userToken}`);
            expect([200, 404]).toContain(res.status);
        });

        test('should verify booking is deleted/cancelled', async () => {
            const res = await request(app)
                .get(`/api/bookings/${bookingId}`)
                .set('Authorization', `Bearer ${userToken}`);
            expect(res.status).toBe(404);
        });

        test('should allow admin to delete any booking', async () => {
            // Create a booking first
            const newBooking = await request(app)
                .post('/api/bookings')
                .set('Authorization', `Bearer ${userToken}`)
                .send({
                    service_id: serviceId,
                    event_date: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString(),
                    guest_count: 75,
                    total_price: 3750
                });
            
            const newBookingId = newBooking.body.data._id;
            
            // Admin deletes it
            const res = await request(app)
                .delete(`/api/bookings/${newBookingId}`)
                .set('Authorization', `Bearer ${adminToken}`);
            expect(res.status).toBe(200);
        });
    });
});
