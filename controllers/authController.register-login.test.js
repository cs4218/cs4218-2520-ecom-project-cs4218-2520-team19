import { loginController } from "./authController";
import userModel from "../models/userModel";
import { comparePassword } from "../helpers/authHelper";
import JWT from "jsonwebtoken";

jest.mock('../models/userModel');
jest.mock('../helpers/authHelper');
jest.mock('jsonwebtoken');

describe('loginController tests', () => {
    const mockUser = {
        _id: '123',
        name: 'John',
        email: 'john@gmail.com',
        password: 'hashedPassword123',
        phone: '11112222',
        address: 'hillview street 12',
        role: 0,
        answer: 'football',
    };
    
    let req, res;

    beforeEach(() => {
        req = {
            body: {
                email: 'john@gmail.com',
                password: 'password123',
            }
        };
        res = {
            status: jest.fn().mockReturnThis(),
            send: jest.fn(),
        };
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should return a response code of 400 for missing email', async () => {
        req.body.email = '';

        await loginController(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.send).toHaveBeenCalledWith({
            success: false,
            message: "Missing email or password"
        });
    });

    it('should return a response code of 400 for missing password', async () => {
        req.body.password = '';

        await loginController(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.send).toHaveBeenCalledWith({
            success: false,
            message: "Missing email or password"
        });
    });

    it('should return a response code of 400 for both invalid email and password', async () => {
        req.body.email = '';
        req.body.password = '';
        await loginController(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.send).toHaveBeenCalledWith({
            success: false,
            message: "Missing email or password"
        });
    });

    it('should return response code of 404 if user not found', async () => {
        userModel.findOne.mockResolvedValueOnce(null);

        await loginController(req, res);

        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.send).toHaveBeenCalledWith({
            success: false,
            message: 'Email is not registered',
        });
    });

    it('should return response code of 401 if password is incorrect', async () => {
        userModel.findOne.mockResolvedValueOnce(mockUser);
        comparePassword.mockResolvedValueOnce(false);

        await loginController(req, res);

        expect(comparePassword).toHaveBeenCalledWith('password123', 'hashedPassword123');
        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.send).toHaveBeenCalledWith({
            success: false,
            message: "Incorrect Password",
        });
    });

    it('should generate a token for valid user', async () => {
        userModel.findOne.mockResolvedValueOnce(mockUser);
        comparePassword.mockResolvedValueOnce(true);
        jest.spyOn(JWT, 'sign');

        await loginController(req, res);

        expect(JWT.sign).toHaveBeenCalledWith(
            {_id: '123'}, 
            process.env.JWT_SECRET, 
            {expiresIn: '7d'}
        );

        JWT.sign.mockRestore();
    });

    it('should send a response code of 200 for successful login', async () => {
        userModel.findOne.mockResolvedValueOnce(mockUser);
        comparePassword.mockResolvedValueOnce(true);
        JWT.sign.mockResolvedValueOnce('mockToken');

        await loginController(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.send).toHaveBeenCalledWith({
            success: true,
            message: 'Login Successfully',
            user: {
                _id: '123',
                name: 'John',
                email: 'john@gmail.com',
                phone: '11112222',
                address: 'hillview street 12',
                role: 0,
            },
            token: 'mockToken',
        });
    });

    it('should send a response code of 500 when an error occurred', async () => {
        const error = new Error('Unexpected error while finding user');
        userModel.findOne.mockRejectedValueOnce(error);
        jest.spyOn(console, 'log').mockImplementation(() => {});

        await loginController(req, res);

        expect(console.log).toHaveBeenCalledWith(error);
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.send).toHaveBeenCalledWith({
            success: false,
            message: 'Error in login',
            error: error,
        });

        console.log.mockRestore();
    });
});
