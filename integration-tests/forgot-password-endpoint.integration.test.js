// Teo Kim Han, A0273551E

import dotenv from 'dotenv';
import request from 'supertest';
import express from 'express';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import authRoutes from '../routes/authRoute.js';
import { hashPassword, comparePassword } from "../helpers/authHelper.js";
import userModel from '../models/userModel.js';

// First run of the test suite may take longer due to MongoDB Memory Server setup
jest.setTimeout(30000);

// Set up the server for testing
dotenv.config();
const app = express();
app.use(express.json());
app.use('/api/v1/auth', authRoutes);

const forgotPasswordRoute = '/api/v1/auth/forgot-password';
let mongoServer;

const createUser = async () => {
        const hashedPassword = await hashPassword('Password123!');
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

describe('Forgot Password Endpoint Integration Tests', () => {
    beforeAll(async () => {
        mongoServer = await MongoMemoryServer.create();
        const uri = mongoServer.getUri();
        await mongoose.connect(uri);
    });

    beforeEach(async () => {
        await userModel.deleteMany({});
    });

    afterAll(async () => {
        await mongoose.connection.dropDatabase();
        await mongoose.disconnect();

        await mongoServer.stop();
    });

    test('Happy Path: Should reset password successfully for an existing user', async () => {
        const user = await createUser();
        await user.save();

        const res = await request(app).post(forgotPasswordRoute).send({
            email: 'test@example.com',
            answer: 'test answer',
            newPassword: 'NewPassword123!'
        });
        const updatedUser = await userModel.findOne({ email: 'test@example.com' });
        const isPasswordUpdated = await comparePassword('NewPassword123!', updatedUser.password);
        
        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('success', true);
        expect(res.body).toHaveProperty('message');
        expect(isPasswordUpdated).toBe(true);
    });

    test('Should return 400 if email field is missing', async () => {
        const res = await request(app).post(forgotPasswordRoute).send({
            answer: 'test answer',
            newPassword: 'NewPassword123!'
        });

        expect(res.status).toBe(400);
        expect(res.body).toHaveProperty('success', false);
        expect(res.body).toHaveProperty('message');
    });

    test('Should return 400 if answer field is missing', async () => {
        const res = await request(app).post(forgotPasswordRoute).send({
            email: 'test@example.com',
            newPassword: 'NewPassword123!'
        });

        expect(res.status).toBe(400);
        expect(res.body).toHaveProperty('success', false);
        expect(res.body).toHaveProperty('message');
    });

    test('Should return 400 if new password field is missing', async () => {
        const res = await request(app).post(forgotPasswordRoute).send({
            email: 'test@example.com',
            answer: 'test answer',
        });

        expect(res.status).toBe(400);
        expect(res.body).toHaveProperty('success', false);
        expect(res.body).toHaveProperty('message');
    });

    test('Should return 404 if user email is not found', async () => {
        const res = await request(app).post(forgotPasswordRoute).send({
            email: 'nonexistent@example.com',
            answer: 'test answer',
            newPassword: 'NewPassword123!'
        });

        expect(res.status).toBe(404);
        expect(res.body).toHaveProperty('success', false);
        expect(res.body).toHaveProperty('message');
    });

    test('Should return 404 if email is incorrect' , async () => {
        const user = await createUser();
        await user.save();

        const res = await request(app).post(forgotPasswordRoute).send({
            email: 'invalid-email@example.com',
            answer: 'test answer',
            newPassword: 'NewPassword123!'
        });

        expect(res.status).toBe(404);
        expect(res.body).toHaveProperty('success', false);
        expect(res.body).toHaveProperty('message');
    });

    test('Should return 404 if answer is incorrect', async () => {
        const user = await createUser();
        await user.save();

        const res = await request(app).post(forgotPasswordRoute).send({
            email: 'test@example.com',
            answer: 'incorrect answer',
            newPassword: 'NewPassword123!'
        });
        const updatedUser = await userModel.findOne({ email: 'test@example.com' });
        const isPasswordUpdated = await comparePassword('NewPassword123!', updatedUser.password);

        expect(res.status).toBe(404);
        expect(res.body).toHaveProperty('success', false);
        expect(res.body).toHaveProperty('message');
        expect(isPasswordUpdated).toBe(false);
    });

    // Teo Kim Han (A0273551E), MS3-Security Testing
    describe('password strength should be enforced in forgot password endpoint', () => {
        const weakPasswords = [
            'Abcde1!',      // 7 chars — expected: "at least 8 characters"
            'abcdef1!',     // expected: "at least 1 uppercase letter"
            'ABCDEF1!',     // expected: "at least 1 lowercase letter"
            'Abcdef!!',     // expected: "at least 1 number"
            'Abcdef12',     // expected: "at least 1 special character"
            '',             // 0 chars — expected: length or empty-string error
        ];
    
        test.each(weakPasswords)(
            'Should return 400 for weak password: %s',
            async (pw) => {
                const user = await createUser();
                await user.save();
    
                const res = await request(app).post(forgotPasswordRoute).send({
                    email: 'test@example.com',
                    answer: 'test answer',
                    newPassword: pw
                });
                const updatedUser = await userModel.findOne({ email: user.email });
                const isPasswordUpdated = await comparePassword(pw, updatedUser.password);
    
                expect(res.status).toBe(400);
                expect(res.body).toHaveProperty('success', false);
                expect(res.body).toHaveProperty('message');
                expect(isPasswordUpdated).toBe(false);
            }
        );
    });
});
