import axios from "axios";
import Orders from './Orders';
import { screen, render, waitFor} from '@testing-library/react';
import React from 'react';
import '@testing-library/jest-dom/extend-expect';
import { MemoryRouter } from 'react-router-dom';
import toast from "react-hot-toast";

jest.mock('axios');
jest.mock('react-hot-toast');

jest.mock('../../context/auth', () => ({
    useAuth: jest.fn(() => [{token: "fake-token"}, jest.fn()]) // Mock useAuth hook to return a fake token and a mock function for setAuth
}));

// Mock Layout component to simply render its children and titl
jest.mock('../../components/Layout', () => ({ children, title }) => (
    <div>
        <h1>{title}</h1>
        {children}
    </div>
));

// Sample orders data for testing
function sampleGoodOrders() {
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
function sampleFailedOrders() {
    const mockOrders = [
        {
            _id: 'order1',
            products: [
                {_id: 'prod_1', name: "Product 1", description: "Description 1", price: 100},
                {_id: 'prod_2', name: "Product 2", description: "Description 2", price: 200},
                {_id: 'prod_3', name: "Product 3", description: "Description 3", price: 300}
            ],
            payment: {success: false},
            buyer: {name: "John Doe"},
            status: "Delivered",
            createAt: new Date().toISOString()
        }
    ];
    return mockOrders;
}

// Tests to check Orders component mounting behavior
describe('Orders mounting behavior', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });
    test('does not fetch orders when user is not authenticated', async () => {

        const useAuth = require('../../context/auth').useAuth;
        useAuth.mockImplementationOnce(() => [{token: null}, jest.fn()]); // Mock unauthenticated user

        // Act: Render the Orders component
        render(
            <MemoryRouter>
                <Orders/>
            </MemoryRouter>
        );
        
        // Assert: Verify that axios.get was not called
        await waitFor(() => {
            expect(axios.get).not.toHaveBeenCalled();
        });
    });
    test('fetches user orders on mount when user is authenticated', async () => {
    // Arrange: Mock the axios.get method to return an empty array of orders
    axios.get.mockResolvedValueOnce({data: []});

    // Act: Render the Orders component
    render(
        <MemoryRouter>
            <Orders/>
        </MemoryRouter>
    );
    // Assert: Verify that axios.get was called with the correct endpoint
    await waitFor(() => {
        expect(axios.get).toHaveBeenCalledWith('/api/v1/auth/orders');
    });
});
    test('renders failure message on fetch error', async () => {
    // Arrange: Mock axios.get to throw an error
    axios.get.mockRejectedValueOnce(new Error('Network Error'));

    // Act: Render the Orders component
    render(
        <MemoryRouter>
            <Orders/>
        </MemoryRouter>
    );

    // Assert: Verify that toast.error was called with the correct message
    await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Something went wrong');
    });
});
});

// Tests to check if order details are rendered correctly
describe('All order details rendering', () => {
    const mockOrders = sampleGoodOrders();

    // Mock the axios.get method before each test in this suite
    beforeEach(() => {

        // Arrange: Mock axios.get to return mockOrders
        jest.clearAllMocks();
        axios.get.mockResolvedValueOnce({data: mockOrders});

        // Act: Render the Orders component
        render(
            <MemoryRouter>
                <Orders/>
            </MemoryRouter>
        );
    });

    test("render product names", async () => {
        // Assert: Check if product names are rendered
        await waitFor(() => {
            expect(screen.getByText("Product 1")).toBeInTheDocument();
            expect(screen.getByText("Product 2")).toBeInTheDocument();
            expect(screen.getByText("Product 3")).toBeInTheDocument();
        });
    });

    test("render buyer name", async () => {
        // Assert: Check if buyer name is rendered
        await waitFor(() => {
            expect(screen.getByText("John Doe")).toBeInTheDocument();
        });
    });

    test("render order status", async () => {
        // Assert: Check if order status is rendered
        await waitFor(() => {
            expect(screen.getByText("Delivered")).toBeInTheDocument();
        });
    });

    test("render success payment status", async () => {
        // Assert: Check if payment status is rendered
        await waitFor(() => {
            expect(screen.getByText("Success")).toBeInTheDocument();
        });
    });


    test("render product quantities", async () => {
        await waitFor(() => {
            // Assert that product quantity is rendered
            expect(screen.getByTestId("order-quantity")).toHaveTextContent("3");
            });
    });

    test("render product prices", async () => {
        await waitFor(() => {
            // Assert that product prices are rendered
            expect(screen.getByText("Price : 100")).toBeInTheDocument();
            expect(screen.getByText("Price : 200")).toBeInTheDocument();
            expect(screen.getByText("Price : 300")).toBeInTheDocument();
        });
    });

    test("render product images", async () => {
        await waitFor(() => {
            // Check if images are rendered with correct src attributes
            const img1 = screen.getByAltText("Product 1");
            const img2 = screen.getByAltText("Product 2");
            const img3 = screen.getByAltText("Product 3");
            // Assert that the images are in the document and have correct src
            expect(img1).toBeInTheDocument();
            expect(img2).toBeInTheDocument();
            expect(img3).toBeInTheDocument();
            // Check src attributes
            expect(img1).toHaveAttribute('src', '/api/v1/product/product-photo/prod_1');
            expect(img2).toHaveAttribute('src', '/api/v1/product/product-photo/prod_2');
            expect(img3).toHaveAttribute('src', '/api/v1/product/product-photo/prod_3');
        });
    });
});

// Test to check rendering of failed payment status
test("render failed payment status", async () => {
    // Arrange: Mock axios.get to return failed payment order
    jest.clearAllMocks();
    const failedOrders = sampleFailedOrders();
    axios.get.mockResolvedValueOnce({data: failedOrders});

    // Act: Render the Orders component
    render(
        <MemoryRouter>
            <Orders/>
        </MemoryRouter>
    );

    // Assert: Check if failed payment status is rendered
    await waitFor(() => {
        expect(screen.getByText("Failed")).toBeInTheDocument();
    });
});

// Tests to check if order table headers are rendered correctly
describe('Orders Component Headers', () => {
    const mockOrders = sampleGoodOrders();

    // Mock the axios.get method before each test in this suite
    beforeEach(() => {
        // Arrange: Mock axios.get to return mockOrders
        jest.clearAllMocks();
        axios.get.mockResolvedValueOnce({data: mockOrders});
        // Act: Render the Orders component
        render(
            <MemoryRouter>
                <Orders/>
            </MemoryRouter>
        );
    });

    test("render col #", async () => {
        await waitFor(() => {
            // Assert: Check if column header "#" is rendered
            expect(screen.getByText("#")).toBeInTheDocument();
        });
    });

    test("render col Status", async () => {
        await waitFor(() => {
            // Assert: Check if column header "Status" is rendered
            expect(screen.getByText("Status")).toBeInTheDocument();
        });
    });

    test("render col buyer", async () => {
        await waitFor(() => {
            // Assert: Check if column header "Buyer" is rendered
            expect(screen.getByText("Buyer")).toBeInTheDocument();
        });
    });

    test("render col date", async () => {
        await waitFor(() => {
            // Assert: Check if column header "Date" is rendered
            expect(screen.getByText("Date")).toBeInTheDocument();
        });
    });

    test("render col payment", async () => {
        await waitFor(() => {
            // Assert: Check if column header "Payment" is rendered
            expect(screen.getByText("Payment")).toBeInTheDocument();
        });
    });

    test("render col Quantity", async () => {
        await waitFor(() => {
            // Assert: Check if column header "Quantity" is rendered
            expect(screen.getByText("Quantity")).toBeInTheDocument();
        });
    });
});