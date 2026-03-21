// Sun Zhiyuan Felix (A0272474Y)

// This file sets up an Express server for testing purposes, using an in-memory MongoDB instance

import express from "express";
import colors from "colors";
import dotenv from "dotenv";
import morgan from "morgan";
import connectDB from "../config/db.js";
import authRoutes from '../routes/authRoute.js'
import categoryRoutes from '../routes/categoryRoutes.js'
import productRoutes from '../routes/productRoutes.js'
import cors from "cors";
import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
import userModel from "../models/userModel.js";
import { hashPassword } from "../helpers/authHelper.js";
import { seededAdmin } from "../e2e-tests/isolated-environment-tests/seededAdmin.js";

let mongoServer;
let server;

// configure env
dotenv.config();

const app = express();

//middlewares
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

//routes
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/category", categoryRoutes);
app.use("/api/v1/product", productRoutes);

// rest api

app.get('/', (req,res) => {
    res.send("<h1>Welcome to ecommerce app</h1>");
});

const PORT = process.env.PORT || 6060;

async function seedPlaywrightAdmin() {
    const admin = seededAdmin;
    const existingAdmin = await userModel.findOne({ email: admin.email });

    if (existingAdmin) {
        return;
    }

    const hashedPassword = await hashPassword(admin.password);

    await userModel.create({
        name: admin.name,
        email: admin.email,
        password: hashedPassword,
        phone: admin.phone,
        address: admin.address,
        answer: admin.answer,
        role: admin.role,
    });
}

async function startTestServer() {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();

    process.env.MONGO_URL = mongoUri;
    process.env.JWT_SECRET = process.env.JWT_SECRET || "test-jwt-secret";

    //database config
    await connectDB();
    await seedPlaywrightAdmin();

    await new Promise((resolve) => {
        server = app.listen(PORT, () => {
            console.log(`Test server running on ${process.env.DEV_MODE} mode on ${PORT}`.bgCyan.white);
            resolve();
        });
    });
};

async function stopTestServer() {
    server.close();
    mongoose.disconnect();
    if (mongoServer) {
        await mongoServer.stop();
    }
}

async function clearTestDatabase() {
    if (mongoServer) {
        const collections = mongoose.connection.collections;
        for (const key in collections) {
            await collections[key].deleteMany();
        }
    }
}

async function clearTestDataPreservingUsers() {
    if (!mongoServer) {
        return;
    }

    const collections = mongoose.connection.collections;
    for (const key in collections) {
        if (key === 'users') {
            continue;
        }
        await collections[key].deleteMany();
    }
}

async function resetTestDatabase() {
    // Keep seeded users so login remains stable between tests.
    await clearTestDataPreservingUsers();
}

// Test-only utility route for isolated Playwright specs.
app.post('/api/v1/test/reset', async (req, res) => {
    try {
        await resetTestDatabase();
        res.status(200).send({ success: true });
    } catch (error) {
        res.status(500).send({ success: false, message: 'Failed to reset test database' });
    }
});

export { startTestServer, stopTestServer, clearTestDatabase, resetTestDatabase };