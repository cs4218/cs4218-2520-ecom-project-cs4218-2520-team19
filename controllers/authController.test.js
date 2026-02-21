// Varatharaju Mithuna, A0281223N

jest.mock("../models/orderModel", () => ({
    find: jest.fn()
}));
jest.mock("../models/userModel", () => ({
    findById: jest.fn(),
    findByIdAndUpdate: jest.fn()
}));
jest.mock("../helpers/authHelper", () => ({
    hashPassword: jest.fn((password) => `hashed_${password}`)
}));

const {updateProfileController, getOrdersController, getAllOrdersController, orderStatusController } =
    require("./authController");
const orderModel = require("../models/orderModel");
const userModel = require("../models/userModel");
const {hashPassword} = require("../helpers/authHelper");

function sampleOrders() {
    const mockOrders = [
        {
            _id: 'order1',
            products: [
                {_id: 'prod_1', name: "Product 1", description: "Description 1", price: 100},
                {_id: 'prod_2', name: "Product 2", description: "Description 2", price: 200},
                {_id: 'prod_3', name: "Product 3", description: "Description 3", price: 300}
            ],
            payment: {success: true},
            buyer: {name: "John Doe"},
            status: "Delivered",
            createdAt: new Date().toISOString()
        }
    ];
    return mockOrders;
}
function allOrders() {
    const mockOrders = [
        {
            _id: 'order1',
            products: [
                {_id: 'prod_1', name: "Product 1", description: "Description 1", price: 100},
                {_id: 'prod_2', name: "Product 2", description: "Description 2", price: 200},
                {_id: 'prod_3', name: "Product 3", description: "Description 3", price: 300}
            ],
            payment: {success: true},
            buyer: {name: "John Doe"},
            status: "Delivered",
            createdAt: new Date().toISOString()
        },
        {
            _id: 'order2',
            products: [
                {_id: 'prod_1', name: "Product 1", description: "Description 1", price: 100},
                {_id: 'prod_2', name: "Product 2", description: "Description 2", price: 200},
                {_id: 'prod_3', name: "Product 3", description: "Description 3", price: 300}
            ],
            payment: {success: true},
            buyer: {name: "Jane Smith"},
            status: "Delivered",
            createdAt: new Date().toISOString()
        }
    ];
    return mockOrders;
}

describe('getOrdersController', () => {
    const req = {
        user: {_id: 'user123'}
    };
    const res = {
        json: jest.fn(),
        status: jest.fn().mockReturnThis(),
        send: jest.fn(),
    };
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('getOrdersController returns orders for authentiated user', async () => {
        const mockOrders = sampleOrders();

        // Stub the populate method to return mock orders
        const populateMock = jest.fn().mockReturnValue({
            populate: jest.fn().mockResolvedValue(mockOrders)
        });
        orderModel.find.mockReturnValue({populate: populateMock});

        await getOrdersController(req, res);

        // Check communication with orderModel
        expect(orderModel.find).toHaveBeenCalledWith({buyer: 'user123'});

        // Check that populate was called correctly
        expect(populateMock).toHaveBeenCalledWith("products", "-photo");
        expect(populateMock().populate).toHaveBeenCalledWith("buyer", "name");

        // Check output
        expect(res.json).toHaveBeenCalledWith(mockOrders);
    })
    test('getOrdersController returns empty array when no orders found', async () => {

        const populateMock = jest.fn().mockReturnValue({
            populate: jest.fn().mockResolvedValue([])
        });

        orderModel.find.mockReturnValue({populate: populateMock});

        await getOrdersController(req, res);

        expect(orderModel.find).toHaveBeenCalledWith({buyer: 'user123'});
        expect(res.json).toHaveBeenCalledWith([]);
    });
    test('getOrdersController returns error on failure', async () => {

        const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

        // Stub the find method to throw an error
        orderModel.find.mockImplementation(() => {
            throw new Error('DB Error');
        });
        await getOrdersController(req, res);

        // Check response
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.send).toHaveBeenCalledWith(expect.objectContaining({
            success: false,
            message: "Error While Getting Orders",
        }));

        consoleSpy.mockRestore();
    });
});

describe('getAllOrdersController', () => {
    const req = {};
    const res = {
        json: jest.fn(),
        status: jest.fn().mockReturnThis(),
        send: jest.fn(),
    };
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('getAllOrdersController returns all orders', async () => {
        const mockOrders = allOrders();

        // Stub the populate method to return mock orders
        const populateMock = jest.fn().mockReturnValue({
            populate: jest.fn().mockReturnValue({
                sort: jest.fn().mockResolvedValue(mockOrders)
            })
        });
        orderModel.find.mockReturnValue({populate: populateMock});

        await getAllOrdersController(req, res);

        // Check populate calls
        expect(populateMock).toHaveBeenCalledWith("products", "-photo");
        expect(populateMock().populate).toHaveBeenCalledWith("buyer", "name");
        expect(populateMock().populate().sort).toHaveBeenCalledWith({ createdAt: -1 });

        expect(orderModel.find).toHaveBeenCalledWith({});
        expect(res.json).toHaveBeenCalledWith(mockOrders);
    });
    test('getAllOrdersController returns error on failure', async () => {

        const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

        orderModel.find.mockImplementation(() => {
            throw new Error('DB Error');
        });
        await getAllOrdersController(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.send).toHaveBeenCalledWith(expect.objectContaining({
            success: false,
            message: "Error While Getting Orders",
        }));

        consoleSpy.mockRestore();
    });
    test('getAllOrdersController returns empty array when no orders found', async () => {

        // Stub the populate method to return empty array
            const populateMock = jest.fn().mockReturnValue({
                populate: jest.fn().mockReturnValue({
                    sort: jest.fn().mockResolvedValue([])
                })
            });

            orderModel.find.mockReturnValue({populate: populateMock});

            await getAllOrdersController(req, res);

            expect(orderModel.find).toHaveBeenCalledWith({});
            expect(res.json).toHaveBeenCalledWith([]);
        });
    });

describe('orderStatusController', () => {
    const req = {
        params: {orderId: 'order123'},
        body: {status: 'Shipped'}
    };
    const res = {
        json: jest.fn(),
        status: jest.fn().mockReturnThis(),
        send: jest.fn(),
    };
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('orderStatusController updates order status', async () => {

        const updatedOrder = {
            _id: 'order123',
            status: 'Shipped'
        };

        // Stub the findByIdAndUpdate method to return updated order
        orderModel.findByIdAndUpdate = jest.fn().mockResolvedValue(updatedOrder);

        await orderStatusController(req, res);

        expect(orderModel.findByIdAndUpdate).toHaveBeenCalledWith(
            'order123',
            {status: 'Shipped'},
            {new: true, runValidators: true}
        );
        expect(res.json).toHaveBeenCalledWith(updatedOrder);
    });
    test('updates order status even if status is same as current status', async () => {
        const updatedOrder = {
            _id: 'order123',
            status: 'Shipped'
        };

        // Stub the findByIdAndUpdate method to return updated order
        orderModel.findByIdAndUpdate = jest.fn().mockResolvedValue(updatedOrder);
        const reqSameStatus = {
            params: {orderId: 'order123'},
            body: {status: 'Shipped'}
        };

        await orderStatusController(reqSameStatus, res);

        expect(orderModel.findByIdAndUpdate).toHaveBeenCalledWith(
            'order123',
            {status: 'Shipped'},
            {new: true, runValidators: true}
        );
        expect(res.json).toHaveBeenCalledWith(updatedOrder);
    });
    test('accepts all valid status values', async () => {
        const validStatuses = ["Not Processed", "Processing", "Shipped", "Delivered", "Cancelled"];
        for (const status of validStatuses) {
            const updatedOrder = {
                _id: 'order123',
                status
            };

            orderModel.findByIdAndUpdate = jest.fn().mockResolvedValue(updatedOrder);
            const reqValidStatus = {
                params: {orderId: 'order123'},
                body: {status}
            };

            await orderStatusController(reqValidStatus, res);

            expect(orderModel.findByIdAndUpdate).toHaveBeenCalledWith(
                'order123',
                {status},
                {new: true, runValidators: true}
            );
            expect(res.json).toHaveBeenCalledWith(updatedOrder);
        }
    });

    test('orderStatusController returns error on failure', async () => {

        const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

        // Stub the findByIdAndUpdate method to throw error
        orderModel.findByIdAndUpdate = jest.fn().mockImplementation(() => {
            throw new Error('DB Error');
        });

        await orderStatusController(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.send).toHaveBeenCalledWith(expect.objectContaining({
            success: false,
            message: "Error While Updating Order",
        }));

        consoleSpy.mockRestore();
    });
    test('orderStatusController handles validation error thrown by model', async () => {

        const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

        const reqInvalid = {
            params: {orderId: 'order123'},
            body: {status: 'InvalidStatus'}
        }

        // Stub the findByIdAndUpdate method to throw validation error
        orderModel.findByIdAndUpdate = jest.fn().mockImplementation(() => {
            const error = new Error('Validation Error');
            error.name = 'ValidationError';
            throw error;
        });

        await orderStatusController(reqInvalid, res);

        // Check that findByIdAndUpdate was called
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.send).toHaveBeenCalledWith(expect.objectContaining({
            success: false,
            message: "Error While Updating Order",
        }));

        consoleSpy.mockRestore();
    });

    test('handles when order is not found', async () => {
        // Stub the findByIdAndUpdate method to return null (order not found)
        orderModel.findByIdAndUpdate = jest.fn().mockResolvedValue(null);

        await orderStatusController(req, res);

        expect(orderModel.findByIdAndUpdate).toHaveBeenCalledWith(
            'order123',
            {status: 'Shipped'},
            {new: true, runValidators: true}
        );
        expect(res.json).toHaveBeenCalledWith(null);
    });

});

describe('updateProfileController', () => {
    const req = {
        user: {_id: 'user123'},
        body: {name: 'New Name', password: 'newpassword', phone: '1234567890', address: 'New Address'}
    };
    const res = {
        json: jest.fn(),
        status: jest.fn().mockReturnThis(),
        send: jest.fn(),
    }

    const existingUser = {
        _id: 'user123',
        name: 'Old Name',
        password: 'oldpassword',
        phone: '0987654321',
        address: 'Old Address',
    };

    const updatedUser = {
        ...existingUser,
        name: 'New Name',
        password: 'hashed_newpassword',
        phone: '1234567890',
        address: 'New Address',
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('updateProfileController updates user profile successfully', async() => {

        userModel.findById.mockResolvedValue(existingUser);
        userModel.findByIdAndUpdate.mockResolvedValue(updatedUser);

        await updateProfileController(req, res);

        expect(hashPassword).toHaveBeenCalledWith('newpassword');
        expect(userModel.findById).toHaveBeenCalledWith('user123');
        expect(userModel.findByIdAndUpdate).toHaveBeenCalledWith(
            'user123',
            {
                name: 'New Name',
                password: 'hashed_newpassword',
                phone: '1234567890',
                address: 'New Address',
            },
            {new: true}
        );
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.send).toHaveBeenCalledWith(expect.objectContaining({
            success: true,
            message: "Profile Updated Successfully",
            updatedUser,
        }));
    });
    test('updateProfileController returns error on failure', async() => {

        const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

        userModel.findById.mockImplementation(() => {
            throw new Error('DB Error');
        });


        await updateProfileController(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.send).toHaveBeenCalledWith(expect.objectContaining({
            success: false,
            message: "Error While Updating profile",
        }));

        consoleSpy.mockRestore();
    });

    test('sends error if password = 5 characters and updateProfile not called', async() => {
        const shortPasswordReq = {
            user: {_id: 'user123'},
            body: {name: 'New Name', password: '12345', phone: '1234567890', address: 'New Address'}
        };

        userModel.findById.mockResolvedValue(existingUser);

        await updateProfileController(shortPasswordReq, res);

        expect(res.json).toHaveBeenCalledWith({error: "Password is required and should be 6 characters long"});
        expect(userModel.findByIdAndUpdate).not.toHaveBeenCalled();
        expect(hashPassword).not.toHaveBeenCalled();
    });
    test("password length = 6 characters should update profile successfully", async() => {
        const boundaryPasswordReq = {
            user: {_id: 'user123'},
            body: {name: 'New Name', password: '123456', phone: '1234567890', address: 'New Address'}
        };

        userModel.findById.mockResolvedValue(existingUser);
        userModel.findByIdAndUpdate.mockResolvedValue(updatedUser);

        await updateProfileController(boundaryPasswordReq, res);

        expect(hashPassword).toHaveBeenCalledWith('123456');
        expect(userModel.findById).toHaveBeenCalledWith('user123');
        expect(userModel.findByIdAndUpdate).toHaveBeenCalledWith(
            'user123',
            {
                name: 'New Name',
                password: 'hashed_123456',
                phone: '1234567890',
                address: 'New Address',
            },
            {new: true}
        );
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.send).toHaveBeenCalledWith(expect.objectContaining({
            success: true,
            message: "Profile Updated Successfully",
            updatedUser,
        }));
    });
    test("password length = 7 characters should update profile successfully", async() => {
        const boundaryPasswordReq = {
            user: {_id: 'user123'},
            body: {name: 'New Name', password: '1234567', phone: '1234567890', address: 'New Address'}
        };

        userModel.findById.mockResolvedValue(existingUser);
        userModel.findByIdAndUpdate.mockResolvedValue(updatedUser);

        await updateProfileController(boundaryPasswordReq, res);

        expect(hashPassword).toHaveBeenCalledWith('1234567');
        expect(userModel.findById).toHaveBeenCalledWith('user123');
        expect(userModel.findByIdAndUpdate).toHaveBeenCalledWith(
            'user123',
            {
                name: 'New Name',
                password: 'hashed_1234567',
                phone: '1234567890',
                address: 'New Address',
            },
            {new: true}
        );
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.send).toHaveBeenCalledWith(expect.objectContaining({
            success: true,
            message: "Profile Updated Successfully",
            updatedUser,
        }));
    });

    test('updates profile throws error if phone number is invalid', async() => {
        const invalidPhoneReq = {
            user: {_id: 'user123'},
            body: {name: 'New Name', password: 'newpassword', phone: 'invalidphone', address: 'New Address'}
        };

        userModel.findById.mockResolvedValue(existingUser);

        await updateProfileController(invalidPhoneReq, res);

        expect(res.json).toHaveBeenCalledWith({error: "Phone number should be numeric"});
        expect(userModel.findByIdAndUpdate).not.toHaveBeenCalled();
        expect(hashPassword).not.toHaveBeenCalled();
    });

    test('fails gracefully if hashing password throws error', async() => {

        const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

        const hashingErrorReq = {
            user: {_id: 'user123'},
            body: {name: 'New Name', password: 'newpassword', phone: '1234567890', address: 'New Address'}
        };

        userModel.findById.mockResolvedValue(existingUser);

        hashPassword.mockImplementation(() => {
            throw new Error('Hashing Error');
        });

        await updateProfileController(hashingErrorReq, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.send).toHaveBeenCalledWith(expect.objectContaining({
            success: false,
            message: "Error While Updating profile",
        }));

        consoleSpy.mockRestore();
    });

    test('updateProfileController keeps existing values if all fields are not provided', async() => {
        const emptyReq = {
            user: {_id: 'user123'},
            body: {name: "", password: "", phone: "", address: ""}
        };

        userModel.findById.mockResolvedValue(existingUser);
        userModel.findByIdAndUpdate.mockResolvedValue(existingUser);

        await updateProfileController(emptyReq, res);

        expect(userModel.findById).toHaveBeenCalledWith('user123');
        expect(userModel.findByIdAndUpdate).toHaveBeenCalledWith(
            'user123',
            {
                name: 'Old Name',
                password: 'oldpassword',
                phone: '0987654321',
                address: 'Old Address',
            },
            {new: true}
        );
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.send).toHaveBeenCalledWith(expect.objectContaining({
            success: true,
            message: "Profile Updated Successfully",
            updatedUser: existingUser,
        }));
    });
    test('updateProfileController keeps existing values if some fields(partial updates) are not provided', async() => {
        const partialReq = {
            user: {_id: 'user123'},
            body: {name: "New Name", password: "", phone: "", address: ""}
        };

        const partiallyUpdatedUser = {
            ...existingUser,
            name: 'New Name',
        };

        userModel.findById.mockResolvedValue(existingUser);
        userModel.findByIdAndUpdate.mockResolvedValue(partiallyUpdatedUser);

        await updateProfileController(partialReq, res);

        expect(userModel.findById).toHaveBeenCalledWith('user123');
        expect(userModel.findByIdAndUpdate).toHaveBeenCalledWith(
            'user123',
            {
                name: 'New Name',
                password: 'oldpassword',
                phone: '0987654321',
                address: 'Old Address',
            },
            {new: true}
        );
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.send).toHaveBeenCalledWith(expect.objectContaining({
            success: true,
            message: "Profile Updated Successfully",
            updatedUser: partiallyUpdatedUser,
        }));
    });

    test('updateProfileController handles when user is not found', async() => {
        userModel.findById.mockResolvedValue(null);

        await updateProfileController(req, res);

        expect(userModel.findById).toHaveBeenCalledWith('user123');
        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.send).toHaveBeenCalledWith(expect.objectContaining({
            success: false,
            message: "User not found",
        }));
    });
});