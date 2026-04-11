// Teo Kim Han, A0273551E

import dotenv from "dotenv";
import request from 'supertest';
import express from 'express';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import userModel from "../models/userModel.js";
import authRoutes from '../routes/authRoute.js';
import categoryRoutes from '../routes/categoryRoutes.js';
import { hashPassword } from "../helpers/authHelper.js";
process.env.JWT_SECRET = process.env.JWT_SECRET || "testsecret";
// First run of the test suite may take longer due to MongoDB Memory Server setup
jest.setTimeout(30000);

// Set up the server for testing
dotenv.config();
const app = express();
app.use(express.json());
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/category', categoryRoutes);

let mongoServer;

const userPassword = 'UserPassword123!';
const createUser = async () => {
    const hashedPassword = await hashPassword(userPassword);
    const user = new userModel({
        name: 'Test User',
        email: 'user@example.com',
        phone: '1234567890',
        address: '123 User St',
        password: hashedPassword,
        answer: 'test answer',
        role: 0
    });
    return user;
};

describe('Non-Admins should not be able to access admin-only endpoints', () => {

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
    
    const adminRoutes = [
        { path: '/api/v1/auth/test', method: 'get' },
        { path: '/api/v1/auth/admin-auth', method: 'get' },
        { path: '/api/v1/auth/all-orders', method: 'get' },
        { path: '/api/v1/auth/order-status/:orderId', method: 'put' },
        { path: '/api/v1/category/create-category', method: 'post' },
        { path: '/api/v1/category/update-category/:id', method: 'put' },
        { path: '/api/v1/category/delete-category/:id', method: 'delete' },
    ];

    test.each(adminRoutes)('Should return 403 Forbidden for non-admin user accessing %s', async (route) => {
        const user = await createUser();
        await user.save();
        // Login to get token
        const loginRes = await request(app).post('/api/v1/auth/login').send({
            email: user.email,
            password: userPassword
        });
        const token = loginRes.body.token;

        // Access the admin route
        let response;
        if (route.method === 'get') {
            response = await request(app)
                .get(`${route.path}`)
                .set('Authorization', `${token}`);
        } else if (route.method === 'post') {
            response = await request(app)
                .post(`${route.path}`)
                .set('Authorization', `${token}`)
                .send({ name: 'Test Category' }); // Example payload for category creation
        } else if (route.method === 'put') {
            response = await request(app)
                .put(`${route.path.replace(':id', '123')}`)
                .set('Authorization', `${token}`)
                .send({ name: 'Updated Category' }); // Example payload for category update
        } else if (route.method === 'delete') {
            response = await request(app)
                .delete(`${route.path.replace(':id', '123')}`)
                .set('Authorization', `${token}`);
        }

        expect(response.status).toBe(403);
    });
});