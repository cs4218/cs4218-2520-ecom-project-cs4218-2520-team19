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
            createAt: new Date().toISOString()
        }
    ];
    return mockOrders;
}

describe('getOrdersController', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });
    test('getOrdersController returns orders for authentiated user', async () => {
        const req = {
            user: {_id: 'user123'}
        };
        const res = {
            json: jest.fn(),
            status: jest.fn().mockReturnThis(),
            send: jest.fn(),
        };
        const mockOrders = sampleOrders();

        const populateMock = jest.fn().mockReturnValue({
            populate: jest.fn().mockResolvedValue(mockOrders)
        });

        orderModel.find.mockReturnValue({populate: populateMock});

        await getOrdersController(req, res);

        expect(orderModel.find).toHaveBeenCalledWith({buyer: 'user123'});
        expect(res.json).toHaveBeenCalledWith(mockOrders);
    })

    test('getOrdersController returns empty array when no orders found', async () => {
        const req = {
            user: {_id: 'user123'}
        };
        const res = {
            json: jest.fn(),
            status: jest.fn().mockReturnThis(),
            send: jest.fn(),
        };

        const populateMock = jest.fn().mockReturnValue({
            populate: jest.fn().mockResolvedValue([])
        });

        orderModel.find.mockReturnValue({populate: populateMock});

        await getOrdersController(req, res);

        expect(orderModel.find).toHaveBeenCalledWith({buyer: 'user123'});
        expect(res.json).toHaveBeenCalledWith([]);
    });

    test('getOrdersController returns error on failure', async () => {
        const req = {
            user: {_id: 'user123'}
        };
        const res = {
            json: jest.fn(),
            status: jest.fn().mockReturnThis(),
            send: jest.fn(),
        };

        orderModel.find.mockImplementation(() => {
            throw new Error('DB Error');
        });
        await getOrdersController(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.send).toHaveBeenCalledWith(expect.objectContaining({
            success: false,
            message: "Error While Getting Orders",
        }));
    });
});

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

describe('getAllOrdersController', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });
    test('getAllOrdersController returns all orders', async () => {
        const req = {};
        const res = {
            json: jest.fn(),
            status: jest.fn().mockReturnThis(),
            send: jest.fn(),
        };
        const mockOrders = allOrders();

        const populateMock = jest.fn().mockReturnValue({
            populate: jest.fn().mockReturnValue({
                sort: jest.fn().mockResolvedValue(mockOrders)
            })
        });

        orderModel.find.mockReturnValue({populate: populateMock});

        await getAllOrdersController(req, res);

        expect(orderModel.find).toHaveBeenCalledWith({});
        expect(res.json).toHaveBeenCalledWith(mockOrders);
    });

    test('getAllOrdersController returns error on failure', async () => {
        const req = {};
        const res = {
            json: jest.fn(),
            status: jest.fn().mockReturnThis(),
            send: jest.fn(),
        };

        orderModel.find.mockImplementation(() => {
            throw new Error('DB Error');
        });
        await getAllOrdersController(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.send).toHaveBeenCalledWith(expect.objectContaining({
            success: false,
            message: "Error While Getting Orders",
        }));
    });

    test('getAllOrdersController returns empty array when no orders found', async () => {
            const req = {};
            const res = {
                json: jest.fn(),
                status: jest.fn().mockReturnThis(),
                send: jest.fn(),
            };

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
    beforeEach(() => {
        jest.clearAllMocks();
    });
test('orderStatusController updates order status', async() => {
    const req = {
        params: {orderId: 'order123'},
        body: {status: 'Shipped'}
    };
    const res = {
        json: jest.fn(),
        status: jest.fn().mockReturnThis(),
        send: jest.fn(),
    };

    const updatedOrder = {
        _id: 'order123',
        status: 'Shipped'
    };

    orderModel.findByIdAndUpdate = jest.fn().mockResolvedValue(updatedOrder);

    await orderStatusController(req, res);

    expect(orderModel.findByIdAndUpdate).toHaveBeenCalledWith(
        'order123',
        {status: 'Shipped'},
        {new: true}
    );
    expect(res.json).toHaveBeenCalledWith(updatedOrder);
});

test('orderStatusController returns error on failure', async() => {
    const req = {
        params: {orderId: 'order123'},
        body: {status: 'Shipped'}
    };
    const res = {
        json: jest.fn(),
        status: jest.fn().mockReturnThis(),
        send: jest.fn(),
    };

    orderModel.findByIdAndUpdate = jest.fn().mockImplementation(() => {
        throw new Error('DB Error');
    });

    await orderStatusController(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        message: "Error While Updating Order",
    }));
});
});

describe('updateProfileController', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('updateProfileController updates user profile successfully', async() => {
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
        const req = {
            user: {_id: 'user123'},
            body: {name: 'New Name', password: 'newpassword', phone: '1234567890', address: 'New Address'}
        };
        const res = {
            json: jest.fn(),
            status: jest.fn().mockReturnThis(),
            send: jest.fn(),
        }

        userModel.findById.mockImplementation(() => {
            throw new Error('DB Error');
        });

        await updateProfileController(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.send).toHaveBeenCalledWith(expect.objectContaining({
            success: false,
            message: "Error While Updating profile",
        }));
    });

    test('sends error if password is less than 6 characters and updateProfile not called', async() => {
        const req = {
            user: {_id: 'user123'},
            body: {name: 'New Name', password: '123', phone: '1234567890', address: 'New Address'}
        };
        const res = {
            json: jest.fn(),
            status: jest.fn().mockReturnThis(),
            send: jest.fn(),
        }

        userModel.findById.mockResolvedValue({
            _id: 'user123',
            name: 'Old Name',
            password: 'oldpassword',
            phone: '0987654321',
            address: 'Old Address',
        });

        await updateProfileController(req, res);

        expect(res.json).toHaveBeenCalledWith({error: "Password is required and should be 6 characters long"});
        expect(userModel.findByIdAndUpdate).not.toHaveBeenCalled();
    });

    test('updateProfileController keeps existing values if fields are not provided', async() => {
        const req = {
            user: {_id: 'user123'},
            body: {name: '', password: '', phone: '', address: ''}
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

        userModel.findById.mockResolvedValue(existingUser);
        userModel.findByIdAndUpdate.mockResolvedValue(existingUser);

        await updateProfileController(req, res);

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
});