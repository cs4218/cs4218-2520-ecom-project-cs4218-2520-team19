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
const {afterEach} = require("node:test");

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
            createAt: new Date().toISOString()
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
            createAt: new Date().toISOString()
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

    afterEach(() => {
        jest.restoreAllMocks();
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

        console.log = jest.fn();

        // Stub the find method to throw an error
        orderModel.find.mockImplementation(() => {
            throw new Error('DB Error');
        });
        await getOrdersController(req, res);

        // Check that error was logged
        expect(console.log).toHaveBeenCalledWith(expect.any(Error));

        // Check response
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.send).toHaveBeenCalledWith(expect.objectContaining({
            success: false,
            message: "Error While Getting Orders",
        }));
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

    afterEach(() => {
        jest.restoreAllMocks();
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

        console.log = jest.fn();

        orderModel.find.mockImplementation(() => {
            throw new Error('DB Error');
        });
        await getAllOrdersController(req, res);

        // Check that error was logged
        expect(console.log).toHaveBeenCalledWith(expect.any(Error));

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.send).toHaveBeenCalledWith(expect.objectContaining({
            success: false,
            message: "Error While Getting Orders",
        }));
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

    afterEach(() => {
        jest.restoreAllMocks();
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

    test('orderStatusController returns error on failure', async () => {
        console.log = jest.fn();
        // Stub the findByIdAndUpdate method to throw error
        orderModel.findByIdAndUpdate = jest.fn().mockImplementation(() => {
            throw new Error('DB Error');
        });

        await orderStatusController(req, res);

        // Check that error was logged
        expect(console.log).toHaveBeenCalledWith(expect.any(Error));

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.send).toHaveBeenCalledWith(expect.objectContaining({
            success: false,
            message: "Error While Updating Order",
        }));
    });

    test('orderStatusController rejects invalid status values', async () => {
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

    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('updateProfileController updates user profile successfully', async() => {

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
        userModel.findById.mockImplementation(() => {
            throw new Error('DB Error');
        });

        console.log = jest.fn();

        await updateProfileController(req, res);

        // Check that error was logged
        expect(console.log).toHaveBeenCalledWith(expect.any(Error));

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.send).toHaveBeenCalledWith(expect.objectContaining({
            success: false,
            message: "Error While Updating profile",
        }));
    });

    test('sends error if password is less than 6 characters and updateProfile not called', async() => {
        const shortPasswordReq = {
            user: {_id: 'user123'},
            body: {name: 'New Name', password: '123', phone: '1234567890', address: 'New Address'}
        };

        userModel.findById.mockResolvedValue({
            _id: 'user123',
            name: 'Old Name',
            password: 'oldpassword',
            phone: '0987654321',
            address: 'Old Address',
        });

        await updateProfileController(shortPasswordReq, res);

        expect(res.json).toHaveBeenCalledWith({error: "Password is required and should be 6 characters long"});
        expect(userModel.findByIdAndUpdate).not.toHaveBeenCalled();
        expect(hashPassword).not.toHaveBeenCalled();
    });

    test('updateProfileController keeps existing values if fields are not provided', async() => {
        const emptyReq = {
            user: {_id: 'user123'},
            body: {name: undefined, password: undefined, phone: undefined, address: undefined}
        };

        const existingUser = {
            _id: 'user123',
            name: 'Old Name',
            password: 'oldpassword',
            phone: '0987654321',
            address: 'Old Address',
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