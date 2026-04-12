// Teo Kim Han, A0273551E

import dotenv from "dotenv";
import request from 'supertest';
import express from 'express';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import userModel from "../models/userModel.js";
import authRoutes from '../routes/authRoute.js';
import { hashPassword } from "../helpers/authHelper.js";
import { limiter } from "../middlewares/authMiddleware.js";
process.env.JWT_SECRET = process.env.JWT_SECRET || "testsecret";
// First run of the test suite may take longer due to MongoDB Memory Server setup
jest.setTimeout(30000);

// Set up the server for testing
dotenv.config();
const app = express();
app.use(express.json());
app.use('/api/v1/auth', authRoutes);

const loginRoute = '/api/v1/auth/login';
let mongoServer;

const createUser = async () => {
    const hashedPassword = await hashPassword('StrongPassword123!');
    const user = new userModel({
        name: 'Test User',
        email: 'test@example.com',
        phone: '1234567890',
        address: '123 Test St',
        password: hashedPassword,
        answer: 'test answer'
    });
    return user;
};

describe('Login Endpoint Integration Tests', () => {
    beforeAll(async () => {
        mongoServer = await MongoMemoryServer.create();
        const uri = mongoServer.getUri();
        await mongoose.connect(uri, );
    });

    beforeEach(async () => {
        await userModel.deleteMany({});
    });

    afterAll(async () => {
        await mongoose.connection.dropDatabase();
        await mongoose.disconnect();
        
        await mongoServer.stop();
    });

    test('Happy Path: Should login valid user successfully', async () => {
        const user = await createUser();
        await user.save();

        const res = await request(app).post(loginRoute).send({
            email: 'test@example.com',
            password: 'StrongPassword123!'
        });

        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('success', true);
        expect(res.body).toHaveProperty('user');
        expect(res.body.user).toEqual(expect.objectContaining({
            _id: user._id.toString(),
            name: user.name,
            email: user.email,
            phone: user.phone,
            address: user.address,
            role: user.role,
        }));
        expect(res.body).toHaveProperty('token', expect.any(String));
    });

    test('Should return 400 for missing email', async () => {
        const user = await createUser();
        await user.save();

        const res = await request(app).post(loginRoute).send({
            password: 'StrongPassword123!'
        });

        expect(res.status).toBe(400);
        expect(res.body).toHaveProperty('success', false);
        expect(res.body).toHaveProperty('message');
    });

    test('Should return 400 for missing password', async () => {
        const user = await createUser();
        await user.save();

        const res = await request(app).post(loginRoute).send({
            email: 'test@example.com'
        });

        expect(res.status).toBe(400);
        expect(res.body).toHaveProperty('success', false);
        expect(res.body).toHaveProperty('message');
    });

    test('Should return 404 for unregistered user', async () => {
        const res = await request(app).post(loginRoute).send({
            email: 'nonexistent@example.com',
            password: 'password123'
        });

        expect(res.status).toBe(404);
        expect(res.body).toHaveProperty('success', false);
        expect(res.body).toHaveProperty('message');
    });

    test('Should return 401 for incorrect password', async () => {
        const user = await createUser();
        await user.save();

        const res = await request(app).post(loginRoute).send({
            email: 'test@example.com',
            password: 'wrongpassword'
        });

        expect(res.status).toBe(401);
        expect(res.body).toHaveProperty('success', false);
        expect(res.body).toHaveProperty('message');
    });

    // Teo Kim Han (A0273551E), MS3-Security Testing
    describe('Rate Limiting Tests', () => {
        beforeEach(async () => {
            await limiter.resetKey('test@example.com');
        });

        test('Invalid email should not count towards rate limit', async () => {
            // Make 3 failed login attempts with invalid email
            for (let i = 0; i < 3; i++) {
                await request(app).post(loginRoute).send({
                    email: 'nonexistent@example.com',
                    password: 'password123'
                });
            }
            const res = await request(app).post(loginRoute).send({
                email: 'nonexistent@example.com',
                password: 'password123'
            });

            expect(res.status).toBe(404);
            expect(res.body).toHaveProperty('success', false);
            expect(res.body).toHaveProperty('message');
        });

        test('Should return 429 after exceeding rate limit for password', async () => {
            const user = await createUser();
            await user.save();

            // Make 3 failed login attempts
            for (let i = 0; i < 3; i++) {
                await request(app).post(loginRoute).send({
                    email: 'test@example.com',
                    password: 'WrongPassword123!'
                });
            }
            // 4th attempt should be rate limited
            const res = await request(app).post(loginRoute).send({
                email: 'test@example.com',
                password: 'WrongPassword123!'
            });

            expect(res.status).toBe(429);
            expect(res.body).toHaveProperty('message', 'Too many requests, please try again later.');
        });

        test('Rate limit counter should reset after successful login', async () => {
            const user = await createUser();
            await user.save();

            // Make 2 failed attempts (just under the limit)
            for (let i = 0; i < 2; i++) {
                await request(app).post(loginRoute).send({
                    email: 'test@example.com',
                    password: 'WrongPassword123!'
                });
            }

            // Successful login should reset counter
            await request(app).post(loginRoute).send({
                email: 'test@example.com',
                password: 'StrongPassword123!'
            });

            // Should not be rate limited on next failed attempt
            const res = await request(app).post(loginRoute).send({
                email: 'test@example.com',
                password: 'WrongPassword123!'
            });

            expect(res.status).toBe(401); // Not 429
        });

        test('Rate limit should be scoped per email, not globally', async () => {
            const user = await createUser();
            await user.save();
            const otherUser = new userModel({
                name: 'Other User',
                email: 'other@example.com',
                password: 'StrongPassword123!',
                phone: '0987654321',
                address: '456 Other St',
                answer: 'other answer',
            });
            await otherUser.save();

            // Exhaust rate limit for otherUser
            for (let i = 0; i < 3; i++) {
                await request(app).post(loginRoute).send({
                    email: 'other@example.com',
                    password: 'WrongPassword123!'
                });
            }

            // test@example.com should NOT be affected
            const res = await request(app).post(loginRoute).send({
                email: 'test@example.com',
                password: 'WrongPassword123!'
            });

            expect(res.status).toBe(401); // Not 429
        });

        test('Should allow the attempt exactly at the limit boundary (3rd attempt)', async () => {
            const user = await createUser();
            await user.save();

            for (let i = 0; i < 2; i++) {
                await request(app).post(loginRoute).send({
                    email: 'test@example.com',
                    password: 'WrongPassword123!'
                });
            }

            // 3rd attempt — still within limit, should return 401 not 429
            const res = await request(app).post(loginRoute).send({
                email: 'test@example.com',
                password: 'WrongPassword123!'
            });

            expect(res.status).toBe(401);
        });

        test('Rate limit response should contain retry-after information', async () => {
            const user = await createUser();
            await user.save();

            for (let i = 0; i < 3; i++) {
                await request(app).post(loginRoute).send({
                    email: 'test@example.com',
                    password: 'WrongPassword123!'
                });
            }

            const res = await request(app).post(loginRoute).send({
                email: 'test@example.com',
                password: 'WrongPassword123!'
            });

            expect(res.status).toBe(429);
            expect(res.headers).toHaveProperty('retry-after'); // Important for clients
            expect(res.body).toHaveProperty('message', 'Too many requests, please try again later.');
        });

        test('Rate limit should expire after the cooldown window', async () => {
            const user = await createUser();
            await user.save();

            for (let i = 0; i < 3; i++) {
                await request(app).post(loginRoute).send({
                    email: 'test@example.com',
                    password: 'WrongPassword123!'
                });
            }

            // Simulate window expiry by resetting the key
            await limiter.resetKey('test@example.com');

            const res = await request(app).post(loginRoute).send({
                email: 'test@example.com',
                password: 'WrongPassword123!'
            });

            expect(res.status).toBe(401); // Not 429 — window has reset
        });
    });
});