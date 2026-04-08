// Teo Kim Han, A0273551E
import { requireSignIn, isAdmin } from './authMiddleware.js';
import JWT from 'jsonwebtoken';
import userModel from '../models/userModel.js';

jest.mock('jsonwebtoken');
jest.mock('../models/userModel.js');

let res, req, next, consoleLogSpy;

beforeEach(() => {
    res = {
        status: jest.fn().mockReturnThis(),
        send: jest.fn(),
    };
    req = {
        headers: {authorization: 'stubToken'},
        user: {},
    };
    next = jest.fn();
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {})
});

afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
});

describe('requireSignIn tests', () => {
    it('sets req.user and calls next upon successful jwt verification', async () => {
        // Random JWT Payload is set here
        const jwtPayload = {
            userId: '123',
        };
        JWT.verify.mockReturnValueOnce(jwtPayload);

        await requireSignIn(req, res, next);

        expect(JWT.verify).toHaveBeenCalledWith('stubToken', process.env.JWT_SECRET);
        expect(req.user).toEqual(jwtPayload);
        expect(next).toHaveBeenCalled();
    });
    
    it('throws an error and does not call next upon unsuccessful jwt verification', async () => {
        const error = new Error('unsuccessful verification');
        JWT.verify.mockImplementationOnce(() => {
            throw error;
        });

        await requireSignIn(req, res, next);
        
        expect(JWT.verify).toHaveBeenCalledWith('stubToken', process.env.JWT_SECRET);
        expect(consoleLogSpy).toHaveBeenCalledWith(error);
        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.send).toHaveBeenCalledWith({
            success: false,
            error,
            message: "Error in require sign in middleware",
        });
        expect(next).not.toHaveBeenCalled();
    });
});

describe('isAdmin tests', () => {
    const mockUser = {_id: '123'};
    beforeEach(() => {
        req.user = mockUser;
    });

    it('should allow admin to pass', async () => {
        userModel.findById.mockResolvedValue({role: 1});

        await isAdmin(req, res, next);

        expect(userModel.findById).toHaveBeenCalledWith('123');
        expect(next).toHaveBeenCalled();
    });

    it('should not allow non-admin to pass', async () => {
        userModel.findById.mockResolvedValue({role: 0});
        
        await isAdmin(req, res, next);

        expect(userModel.findById).toHaveBeenCalledWith('123');
        expect(res.status).toHaveBeenCalledWith(403);
        expect(res.send).toHaveBeenCalledWith({
                success: false,
                message: "UnAuthorized Access",
            });
        expect(next).not.toHaveBeenCalled();
    });

    it('should produce an error response if user cannot be found', async () => {
        const error = new Error('User cannot be found')
        userModel.findById.mockRejectedValue(error);

        await isAdmin(req, res, next);

        expect(userModel.findById).toHaveBeenCalledWith('123');
        expect(consoleLogSpy).toHaveBeenCalledWith(error);
        expect(res.status).toHaveBeenCalledWith(403);
        expect(res.send).toHaveBeenCalledWith({
            success: false,
            error: error,
            message: "Error in admin middleware",
        });
        expect(next).not.toHaveBeenCalled();
    });
});