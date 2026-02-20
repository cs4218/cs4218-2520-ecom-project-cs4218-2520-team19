// Teo Kim Han, A0273551E
// Below are tests for Registration and Login feature (with ref to 4-Member Testing Scope)

import { registerController } from "./authController";
import userModel from "../models/userModel";
import { hashPassword } from "../helpers/authHelper";

jest.mock('../models/userModel');
jest.mock('../helpers/authHelper');

describe('registerController tests', () => {
    const userStub = {
        name: 'John',
        email: 'john@gmail.com',
        password: 'password123',
        phone: '11112222',
        address: 'hillview street 12',
        answer: 'football',
    };

    let req, res;

    beforeEach(() => {
        req = { body: {...userStub} };
        res = {
            status: jest.fn().mockReturnThis(),
            send: jest.fn(),
        };
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('validation tests', () => {
        let invalidReqList = [];
        const keys = Object.keys(userStub);

        for (let i = 0; i < keys.length; i++) {
            const newReq = { 
                body: { ...userStub }
            };
            newReq.body[keys[i]] = '';
            invalidReqList.push([keys[i], newReq]);
        }

        it.each(invalidReqList)('should send an unsuccessful response due to empty %s',
            async (field, invalidReq) => {
                await registerController(invalidReq, res);

                expect(res.send).toHaveBeenCalledWith({
                    success: false,
                    message: expect.stringMatching(new RegExp(field, 'i')),
                });
        });
    });

    it('should send a response with status code 409 if duplicate email exists', async () => {
        // Mock findOne to return an existing user
        userModel.findOne.mockResolvedValue({...userStub}); 

        await registerController(req, res);

        expect(res.status).toHaveBeenCalledWith(409);
        expect(res.send).toHaveBeenCalledWith({
            success: false,
            message: expect.any(String),
        });
    });

    it('should send a response with status code 201 if user register successfully', async () => {
        userModel.findOne.mockResolvedValue(null); // no existing user
        hashPassword.mockResolvedValue('stubHashedPw'); // successful hash
        const updatedUserStub = {
            ...userStub,
            password: 'stubHashedPw'
        };
        const saveMock = jest.fn().mockResolvedValue(updatedUserStub);
        // Mock userModel constructor
        userModel.mockImplementation(() => {
            return {save: saveMock}
        });
        
        await registerController(req, res);

        expect(saveMock).toHaveBeenCalled(); // ensure userModel save is called
        expect(res.status).toHaveBeenCalledWith(201);
        expect(res.send).toHaveBeenCalledWith({
            success: true,
            message: expect.any(String),
            user: updatedUserStub,
        });
    });
    
    it('should send a response with status code 500 if an error occured', async () => {
        jest.spyOn(console, 'log').mockImplementation(() => {});
        const error = new Error('No connection to database');
        userModel.findOne.mockRejectedValue(error);

        await registerController(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.send).toHaveBeenCalledWith({
            success: false,
            message: expect.any(String),
            error: error,
        });

        console.log.mockRestore();
    });
});