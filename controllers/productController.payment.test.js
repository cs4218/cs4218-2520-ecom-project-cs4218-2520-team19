// Sun Zhiyuan Felix (A0272474Y)

import braintree from "braintree";
import * as productController from "./productController.js";

const mockResponse = () => {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.send = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
}

jest.mock("braintree");
jest.mock("../models/orderModel.js", () =>
    jest.fn().mockImplementation(() => ({ save: jest.fn().mockResolvedValue({}) }))
);
    
const mockGateway = {
    clientToken: {
        generate: jest.fn(),
    },
    transaction: {
        sale: jest.fn(),
    },
};

braintree.BraintreeGateway = jest.fn().mockReturnValue(mockGateway);
braintree.Environment = { Sandbox: "sandbox" };

const originalEnv = { ...process.env };

describe("brainTreeTokenController", () => {
    beforeEach(() => {
        process.env.BRAINTREE_MERCHANT_ID = "test-merchant";
        process.env.BRAINTREE_PUBLIC_KEY = "test-public";
        process.env.BRAINTREE_PRIVATE_KEY = "test-private";
        productController.initializeGateway();
    });

    afterEach(() => {
        jest.clearAllMocks();
        process.env = { ...originalEnv };
    });

    test("successful token generation", async () => {
        const mockToken = "mocked_token";
        mockGateway.clientToken.generate.mockImplementation((options, callback) => {
            callback(null, { token: mockToken });
        });
        const req = {};
        const res = mockResponse();

        await productController.brainTreeTokenController(req, res);

        expect(res.send).toHaveBeenCalledWith({ token: mockToken });

    });

    test("error during token generation", async () => {
        const mockError = new Error("Token Error");
        mockGateway.clientToken.generate.mockImplementation((options, callback) => {
            callback(mockError, null);
        });
        const req = {};
        const res = mockResponse();

        await productController.brainTreeTokenController(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.send).toHaveBeenCalledWith(mockError);
        });
});

describe("brainTreePaymentController", () => {
    beforeEach(() => {
        process.env.BRAINTREE_MERCHANT_ID = "test-merchant";
        process.env.BRAINTREE_PUBLIC_KEY = "test-public";
        process.env.BRAINTREE_PRIVATE_KEY = "test-private";
        productController.initializeGateway();
    });

    afterEach(() => {
        jest.clearAllMocks();
        process.env = { ...originalEnv };
    });

    test("successful payment processing", async () => {
        const mockNonce = "mock-nonce";
        const mockCart = [{ price: 10 }, { price: 20 }];
        const mockTransactionResult = { success: true };
        mockGateway.transaction.sale.mockImplementation((transactionDetails, callback) => {
            callback(null, mockTransactionResult);
        });

        const req = { 
            body: { nonce: mockNonce, cart: mockCart },
            user: { _id: "mockId" },
        };
        const res = mockResponse();

        await productController.brainTreePaymentController(req, res);
        expect(mockGateway.transaction.sale).toHaveBeenCalledWith(
            expect.objectContaining({
                amount: 30.00,
                paymentMethodNonce: mockNonce,
                options: { submitForSettlement: true },
            }),
            expect.any(Function)
        );
        expect(res.json).toHaveBeenCalledWith({ ok: true });
    });

    test("error during payment processing", async () => {
        const mockNonce = "mock-nonce";
        const mockCart = [{ price: 10 }, { price: 20 }];
        const mockError = new Error("Gateway Sale Error");
        mockGateway.transaction.sale.mockImplementation((transactionDetails, callback) => {
            callback(mockError, null);
        });

        const req = { 
            body: { nonce: mockNonce, cart: mockCart },
            user: { _id: "mockId" },
        };
        const res = mockResponse();

        await productController.brainTreePaymentController(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.send).toHaveBeenCalledWith(mockError);
    });
});