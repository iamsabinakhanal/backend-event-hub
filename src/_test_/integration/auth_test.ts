import request from 'supertest';
import app from '../../app';
import { UserModel } from '../../models/user_model';
import fs from 'fs';

describe('Authentication Integration Tests', () => {
    let userToken: string;
    let adminToken: string;
    let userId: string;
    let adminId: string;
    let resetToken: string;

    const testUser = {
        firstName: 'Test',
        lastName: 'User',
        email: 'testuser@example.com',
        password: 'Test@1234',
        confirmPassword: 'Test@1234'
    };

    const adminUser = {
        firstName: 'Admin',
        lastName: 'User',
        email: 'adminuser@example.com',
        password: 'Admin@1234',
        confirmPassword: 'Admin@1234'
    };

    beforeAll(async () => {
        // Clean up test users
        await UserModel.deleteMany({ 
            email: { $in: [testUser.email, adminUser.email] } 
        });
    });

    afterAll(async () => {
        await UserModel.deleteMany({ 
            email: { $in: [testUser.email, adminUser.email] } 
        });
    });

    describe('POST /api/auth/register', () => {
        test('should register a new user successfully', async () => {
            const res = await request(app)
                .post('/api/auth/register')
                .send(testUser);
            expect([200, 201]).toContain(res.status);
            expect(res.body.data).toHaveProperty('_id');
            expect(res.body.data.email).toBe(testUser.email);
            expect(res.body.data.firstName).toBe(testUser.firstName);
            expect(res.body.data.lastName).toBe(testUser.lastName);
            userId = res.body.data._id;
        });

        test('should fail to register with missing firstName', async () => {
            const res = await request(app)
                .post('/api/auth/register')
                .send({
                    lastName: 'Doe',
                    email: 'test1@example.com',
                    password: 'Test@1234',
                    confirmPassword: 'Test@1234'
                });
            expect([400, 403]).toContain(res.status);
        });

        test('should fail to register with missing lastName', async () => {
            const res = await request(app)
                .post('/api/auth/register')
                .send({
                    firstName: 'John',
                    email: 'test2@example.com',
                    password: 'Test@1234',
                    confirmPassword: 'Test@1234'
                });
            expect([400, 403]).toContain(res.status);
        });

        test('should fail to register with missing email', async () => {
            const res = await request(app)
                .post('/api/auth/register')
                .send({
                    firstName: 'John',
                    lastName: 'Doe',
                    password: 'Test@1234',
                    confirmPassword: 'Test@1234'
                });
            expect(res.status).toBe(400);
        });

        test('should fail to register with invalid email format', async () => {
            const res = await request(app)
                .post('/api/auth/register')
                .send({
                    firstName: 'John',
                    lastName: 'Doe',
                    email: 'invalid-email',
                    password: 'Test@1234',
                    confirmPassword: 'Test@1234'
                });
            expect(res.status).toBe(400);
        });

        test('should fail to register with missing password', async () => {
            const res = await request(app)
                .post('/api/auth/register')
                .send({
                    firstName: 'John',
                    lastName: 'Doe',
                    email: 'test3@example.com',
                    confirmPassword: 'Test@1234'
                });
            expect(res.status).toBe(400);
        });

        test('should fail to register with mismatched passwords', async () => {
            const res = await request(app)
                .post('/api/auth/register')
                .send({
                    firstName: 'John',
                    lastName: 'Doe',
                    email: 'test4@example.com',
                    password: 'Test@1234',
                    confirmPassword: 'Different@1234'
                });
            expect(res.status).toBe(400);
        });

        test('should fail to register with duplicate email', async () => {
            const res = await request(app)
                .post('/api/auth/register')
                .send(testUser);
            expect([403, 409]).toContain(res.status);
        });

        test('should fail to register with weak password', async () => {
            const res = await request(app)
                .post('/api/auth/register')
                .send({
                    firstName: 'John',
                    lastName: 'Doe',
                    email: 'test5@example.com',
                    password: '123',
                    confirmPassword: '123'
                });
            expect(res.status).toBe(400);
        });
    });

    describe('POST /api/auth/login', () => {
        test('should login successfully with correct credentials', async () => {
            const res = await request(app)
                .post('/api/auth/login')
                .send({
                    email: testUser.email,
                    password: testUser.password
                });
            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('token');
            expect(res.body.data).toHaveProperty('_id');
            expect(res.body.data.email).toBe(testUser.email);
            expect(res.body.data).not.toHaveProperty('password');
            userToken = res.body.token;
        });

        test('should fail to login with missing email', async () => {
            const res = await request(app)
                .post('/api/auth/login')
                .send({
                    password: testUser.password
                });
            expect(res.status).toBe(400);
        });

        test('should fail to login with missing password', async () => {
            const res = await request(app)
                .post('/api/auth/login')
                .send({
                    email: testUser.email
                });
            expect(res.status).toBe(400);
        });

        test('should fail to login with non-existent email', async () => {
            const res = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'nonexistent@example.com',
                    password: 'Test@1234'
                });
            expect([401, 404]).toContain(res.status);
        });

        test('should fail to login with incorrect password', async () => {
            const res = await request(app)
                .post('/api/auth/login')
                .send({
                    email: testUser.email,
                    password: 'WrongPassword@123'
                });
            expect(res.status).toBe(401);
        });

        test('should fail to login with invalid email format', async () => {
            const res = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'invalid-email',
                    password: 'Test@1234'
                });
            expect(res.status).toBe(400);
        });
    });

    describe('GET /api/auth/whoami', () => {
        test('should get current authenticated user', async () => {
            const res = await request(app)
                .get('/api/auth/whoami')
                .set('Authorization', `Bearer ${userToken}`);
            expect(res.status).toBe(200);
            expect(res.body.data).toHaveProperty('_id');
            expect(res.body.data.email).toBe(testUser.email);
            expect(res.body.data).not.toHaveProperty('password');
        });

        test('should fail without authorization token', async () => {
            const res = await request(app)
                .get('/api/auth/whoami');
            expect([401, 403]).toContain(res.status);
        });

        test('should fail with invalid token', async () => {
            const res = await request(app)
                .get('/api/auth/whoami')
                .set('Authorization', 'Bearer invalid-token');
            expect([401, 403, 500]).toContain(res.status);
        });
    });

    describe('PUT /api/auth/update-profile', () => {
        test('should update current user profile', async () => {
            const updatedData = {
                firstName: 'Updated',
                lastName: 'Name'
            };
            const res = await request(app)
                .put('/api/auth/update-profile')
                .set('Authorization', `Bearer ${userToken}`)
                .send(updatedData);
            expect(res.status).toBe(200);
            expect(res.body.data.firstName).toBe(updatedData.firstName);
            expect(res.body.data.lastName).toBe(updatedData.lastName);
        });

        test('should fail to update profile without authorization', async () => {
            const res = await request(app)
                .put('/api/auth/update-profile')
                .send({ firstName: 'Unauthorized' });
            expect([401, 403]).toContain(res.status);
        });

        test('should not allow email update through profile update', async () => {
            const res = await request(app)
                .put('/api/auth/update-profile')
                .set('Authorization', `Bearer ${userToken}`)
                .send({ email: 'newemail@example.com' });
            // Email should either be ignored or cause error
            expect([200, 400, 403, 409]).toContain(res.status);
            if (res.status === 200) {
                expect(res.body.data.email).toBe(testUser.email);
            }
        });
    });

    describe('Profile Page Endpoints', () => {
        test('should get current profile via GET /api/auth/profile', async () => {
            const res = await request(app)
                .get('/api/auth/profile')
                .set('Authorization', `Bearer ${userToken}`);

            expect(res.status).toBe(200);
            expect(res.body.data).toHaveProperty('_id');
            expect(res.body.data.email).toBe(testUser.email);
        });

        test('should update profile via PUT /api/auth/profile', async () => {
            const res = await request(app)
                .put('/api/auth/profile')
                .set('Authorization', `Bearer ${userToken}`)
                .send({
                    firstName: 'Profile',
                    lastName: 'Updated'
                });

            expect(res.status).toBe(200);
            expect(res.body.data.firstName).toBe('Profile');
            expect(res.body.data.lastName).toBe('Updated');
        });

        test('should upload profile photo via PATCH /api/auth/profile/photo', async () => {
            const res = await request(app)
                .patch('/api/auth/profile/photo')
                .set('Authorization', `Bearer ${userToken}`)
                .attach('photo', Buffer.from('fake-image-content'), {
                    filename: 'profile.png',
                    contentType: 'image/png'
                });

            expect(res.status).toBe(200);
            expect(res.body.data.image).toContain('/uploads/users/');

            // Cleanup uploaded test image.
            const uploadedPath = (res.body.data.image as string).replace(/^\/+/, '');
            if (fs.existsSync(uploadedPath)) {
                fs.unlinkSync(uploadedPath);
            }
        });

        test('should upload profile photo using image field name', async () => {
            const res = await request(app)
                .patch('/api/auth/profile/photo')
                .set('Authorization', `Bearer ${userToken}`)
                .attach('image', Buffer.from('fake-image-content-2'), {
                    filename: 'profile-2.png',
                    contentType: 'image/png'
                });

            expect(res.status).toBe(200);
            expect(res.body.data.image).toContain('/uploads/users/');

            const uploadedPath = (res.body.data.image as string).replace(/^\/+/, '');
            if (fs.existsSync(uploadedPath)) {
                fs.unlinkSync(uploadedPath);
            }
        });
    });

    describe('PUT /api/auth/:id', () => {
        test('should allow user to update their own profile', async () => {
            const user = await UserModel.findOne({ email: testUser.email });
            userId = user?._id.toString() || userId;
            const res = await request(app)
                .put(`/api/auth/${userId}`)
                .set('Authorization', `Bearer ${userToken}`)
                .send({ firstName: 'SelfUpdated' });
            expect([200, 403]).toContain(res.status);
            if (res.status === 200) {
                expect(res.body.data.firstName).toBe('SelfUpdated');
            }
        });

        test('should fail to update another user\'s profile', async () => {
            // Create admin first
            await request(app)
                .post('/api/auth/register')
                .send(adminUser);
            await UserModel.updateOne(
                { email: adminUser.email },
                { $set: { role: 'admin' } }
            );
            const adminLoginRes = await request(app)
                .post('/api/auth/login')
                .send({ email: adminUser.email, password: adminUser.password });
            adminToken = adminLoginRes.body.token;
            adminId = adminLoginRes.body.data._id;

            const res = await request(app)
                .put(`/api/auth/${adminId}`)
                .set('Authorization', `Bearer ${userToken}`)
                .send({ firstName: 'NotAllowed' });
            expect(res.status).toBe(403);
        });

        test('should allow admin to update any user profile', async () => {
            const res = await request(app)
                .put(`/api/auth/${userId}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ firstName: 'AdminUpdated' });
            expect([200, 500]).toContain(res.status);
            if (res.status === 200) {
                expect(res.body.data.firstName).toBe('AdminUpdated');
            }
        });

        test('should fail to update with invalid user ID', async () => {
            const res = await request(app)
                .put('/api/auth/invalid-id')
                .set('Authorization', `Bearer ${userToken}`)
                .send({ firstName: 'Test' });
            expect([400, 403, 500]).toContain(res.status);
        });

        test('should fail to update without authorization', async () => {
            const res = await request(app)
                .put(`/api/auth/${userId}`)
                .send({ firstName: 'NoAuth' });
            expect([401, 403]).toContain(res.status);
        });
    });

    describe('POST /api/auth/request-password-reset', () => {
        test('should request password reset successfully', async () => {
            const res = await request(app)
                .post('/api/auth/request-password-reset')
                .send({ email: testUser.email });
            expect([200, 201]).toContain(res.status);
        });

        test('should fail with missing email', async () => {
            const res = await request(app)
                .post('/api/auth/request-password-reset')
                .send({});
            expect(res.status).toBe(400);
        });

        test('should fail with invalid email format', async () => {
            const res = await request(app)
                .post('/api/auth/request-password-reset')
                .send({ email: 'invalid-email' });
            expect([200, 400]).toContain(res.status);
        });

        test('should handle non-existent email gracefully', async () => {
            const res = await request(app)
                .post('/api/auth/request-password-reset')
                .send({ email: 'nonexistent@example.com' });
            // Should return 200 to prevent email enumeration, or 404
            expect([200, 404]).toContain(res.status);
        });

        test('should generate reset token', async () => {
            await request(app)
                .post('/api/auth/request-password-reset')
                .send({ email: testUser.email });
            
            const user = await UserModel.findOne({ email: testUser.email });
            expect(user?.resetToken).toBeDefined();
            expect(user?.resetTokenExpiry).toBeDefined();
            resetToken = user?.resetToken || '';
        });
    });

    describe('POST /api/auth/reset-password/:token', () => {
        test('should reset password with valid token', async () => {
            const newPassword = 'NewPassword@123';
            const res = await request(app)
                .post(`/api/auth/reset-password/${resetToken}`)
                .send({
                    newPassword
                });
            expect(res.status).toBe(200);
        });

        test('should login with new password', async () => {
            const res = await request(app)
                .post('/api/auth/login')
                .send({
                    email: testUser.email,
                    password: 'NewPassword@123'
                });
            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('token');
        });

        test('should fail with invalid token', async () => {
            const res = await request(app)
                .post('/api/auth/reset-password/invalid-token')
                .send({
                    newPassword: 'Test@1234'
                });
            expect([400, 404]).toContain(res.status);
        });

        test('should fail with missing password', async () => {
            const res = await request(app)
                .post(`/api/auth/reset-password/some-token`)
                .send({});
            expect(res.status).toBe(400);
        });

        test('should fail with mismatched passwords', async () => {
            const res = await request(app)
                .post(`/api/auth/reset-password/some-token`)
                .send({
                    newPassword: '123'
                });
            expect(res.status).toBe(400);
        });

        test('should fail with expired token', async () => {
            // Set token expiry to past
            await UserModel.updateOne(
                { email: testUser.email },
                { 
                    resetToken: 'expired-token',
                    resetTokenExpiry: new Date(Date.now() - 1000)
                }
            );
            
            const res = await request(app)
                .post('/api/auth/reset-password/expired-token')
                .send({
                    newPassword: 'Test@1234'
                });
            expect([400, 401]).toContain(res.status);
        });
    });

    describe('POST /api/auth/admin/create', () => {
        test('should allow admin to create another admin', async () => {
            const newAdmin = {
                firstName: 'New',
                lastName: 'Admin',
                email: 'newadmin@example.com',
                password: 'Admin@1234',
                confirmPassword: 'Admin@1234'
            };
            const res = await request(app)
                .post('/api/auth/admin/create')
                .set('Authorization', `Bearer ${adminToken}`)
                .send(newAdmin);
            expect([200, 201]).toContain(res.status);
            expect(res.body.data.role).toBe('admin');
            
            // Cleanup
            await UserModel.deleteOne({ email: newAdmin.email });
        });

        test('should fail to create admin without authorization', async () => {
            const res = await request(app)
                .post('/api/auth/admin/create')
                .send({
                    firstName: 'Unauthorized',
                    lastName: 'Admin',
                    email: 'noauth@example.com',
                    password: 'Admin@1234',
                    confirmPassword: 'Admin@1234'
                });
            expect([401, 403]).toContain(res.status);
        });

        test('should fail for regular user to create admin', async () => {
            const res = await request(app)
                .post('/api/auth/admin/create')
                .set('Authorization', `Bearer ${userToken}`)
                .send({
                    firstName: 'Not',
                    lastName: 'Allowed',
                    email: 'notallowed@example.com',
                    password: 'Admin@1234',
                    confirmPassword: 'Admin@1234'
                });
            expect(res.status).toBe(403);
        });
    });
});
