// Teo Kim Han, A0273551E
import { requireSignIn, isAdmin } from './authMiddleware';
import JWT from 'jsonwebtoken';
import userModel from '../models/userModel.js';

jest.mock('jsonwebtoken');
jest.mock('../models/userModel.js');

describe('requireSignIn tests', () => {
    const res = {};
    const next = jest.fn();
    // Random JWT Payload is set here
    const jwtPayload = {
        userId: '123',
    };

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('sets req.user and calls next upon successful jwt verification', async () => {
        const req = {
            headers: {authorization: 'validToken'},
        };
        JWT.verify.mockReturnValueOnce(jwtPayload);

        await requireSignIn(req, res, next);

        expect(JWT.verify).toHaveBeenCalledWith('validToken', process.env.JWT_SECRET);
        expect(req.user).toEqual(jwtPayload);
        expect(next).toHaveBeenCalled();
    });
    
    it('throws an error and does not call next upon unsuccessful jwt verification', async () => {
        console.log = jest.fn();
        const req = {
            headers: {authorization: 'invalidToken'},
        };
        const error = new Error('Invalid token');
        JWT.verify.mockImplementationOnce(() => {
            throw error;
        });

        await requireSignIn(req, res, next);
        
        expect(JWT.verify).toHaveBeenCalledWith('invalidToken', process.env.JWT_SECRET);
        expect(console.log).toHaveBeenCalledTimes(1); // The error case calls console.log(error) once
        expect(console.log.mock.calls[0][0].message).toEqual(error.message);
        expect(next).not.toHaveBeenCalled();
    });
});

describe('isAdmin tests', () => {
    const userId = '123';
    const req = {
        user: {_id: userId},
    };
    const next = jest.fn();

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should allow admin to pass', async () => {
        const res = {};
        userModel.findById.mockResolvedValue({role: 1});

        await isAdmin(req, res, next);

        expect(userModel.findById).toHaveBeenCalledWith(userId);
        expect(next).toHaveBeenCalled();
    });

    it('should not allow non-admin to pass', async () => {
        const res = {
            status: jest.fn().mockReturnThis(),
            send: jest.fn(),
        };
        userModel.findById.mockResolvedValue({role: 0});
        
        await isAdmin(req, res, next);

        expect(userModel.findById).toHaveBeenCalledWith(userId);
        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.send).toHaveBeenCalledWith({
                success: false,
                message: "UnAuthorized Access",
            });
        expect(next).not.toHaveBeenCalled();
    });

    it('should produce an error response if user cannot be found', async () => {
        const res = {
            status: jest.fn().mockReturnThis(),
            send: jest.fn(),
        };
        const error = new Error('User cannot be found')
        userModel.findById.mockRejectedValue(error);
        console.log = jest.fn();

        await isAdmin(req, res, next);

        expect(userModel.findById).toHaveBeenCalledWith(userId);
        expect(console.log).toHaveBeenCalledTimes(1);
        expect(console.log.mock.calls[0][0].message).toEqual(error.message);
        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.send).toHaveBeenCalledWith({
            success: false,
            error: error,
            message: "Error in admin middleware",
        });
        expect(next).not.toHaveBeenCalled();
    });
});