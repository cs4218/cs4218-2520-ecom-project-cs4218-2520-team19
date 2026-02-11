import axios from "axios";
import Orders from './Orders';
import { screen, render, waitFor} from '@testing-library/react';
import React from 'react';
import '@testing-library/jest-dom/extend-expect';
import { MemoryRouter } from 'react-router-dom';
import toast from "react-hot-toast";
import moment from "moment";

//Mock axios and toast
jest.mock('axios');
jest.mock('react-hot-toast');

// Mock useAuth hook to simulate authenticated user
jest.mock('../../context/auth', () => ({
    useAuth: jest.fn(() => [{token: "fake-token"}, jest.fn()]) // Mock useAuth hook to return a fake token and a mock function for setAuth
}));

// Mock Layout component to simply render its children and title
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
            createdAt: "2026-02-05T10:00:00Z",
        }
    ];
    return mockOrders;
}

// Tests to check Orders component mounting behavior
describe('Orders mounting behavior', () =>  {
    // Test in isolation: Clear mocks before each test
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('does not fetch orders if user is not authenticated', async () => {

        // Arrange: Stub useAuth to return no token
        const useAuth = require('../../context/auth').useAuth;
        useAuth.mockImplementationOnce(() => [{token: null}, jest.fn()]);

        // Act: Render the Orders component
        render(
            <MemoryRouter>
                <Orders/>
            </MemoryRouter>
        );
        
        // Assert: Verify that axios.get was not called
        await waitFor(() => {
            // Communication-based assertion to ensure axios.get was not called
            expect(axios.get).not.toHaveBeenCalled();
        });
    });
    test('fetches and displays orders on mount if user is authenticated', async () => {

    // Arrange : Stub axios.get to return sample orders
    const data = sampleGoodOrders();
    axios.get.mockResolvedValueOnce({data});

    // Act: Render the Orders component
    render(
        <MemoryRouter>
            <Orders/>
        </MemoryRouter>
    );
    // Assert: Verify that axios.get was called with the correct endpoint
    await waitFor(() => {
        // Communication-based : API call verification
        expect(axios.get).toHaveBeenCalledWith('/api/v1/auth/orders');

        // State-based : Check if order data is rendered
        expect(screen.getByText('Product 1')).toBeInTheDocument();
    });
});
    test('renders failure message on fetch error', async () => {
    // Arrange: Stub axios.get to throw an error
    axios.get.mockRejectedValueOnce(new Error('Network Error'));

    // Act: Render the Orders component
    render(
        <MemoryRouter>
            <Orders/>
        </MemoryRouter>
    );

    // Assert: Verify that toast.error was called with the correct message
    await waitFor(() => {
        // Communication-based assertion to ensure error toast is shown
        expect(toast.error).toHaveBeenCalledWith('Something went wrong');
    });
});
});

// Tests to check if order details are rendered correctly
describe('When orders are present all details are rendered correctly', () => {
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

    test("render time created correctly", async () => {
        await waitFor(() => {
            // Assert that time created is rendered (using fromNow format)
            const formatted  = moment(mockOrders[0].createdAt).fromNow();
            expect(screen.getByText(formatted)).toBeInTheDocument();
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

describe('Orders Component Headers are rendered correctly', () => {
    const mockOrders = sampleGoodOrders();

    // Mock the axios.get method before each test in this suite
    beforeEach(() => {
        // Arrange: Stub axios.get to return mockOrders
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

// Test to check behavior when no orders are present
test("Message when no orders are present", async () => {
    // Arrange: Stub axios.get to return empty orders array
    jest.clearAllMocks();
    axios.get.mockResolvedValueOnce({data: []});

    // Act: Render the Orders component
    render(
        <MemoryRouter>
            <Orders/>
        </MemoryRouter>
    );

    // Assert: Check if "No orders found" message is rendered
    await waitFor(() => {
        // State-based assertion to check for no orders message
        expect(toast.success).toHaveBeenCalledWith("No orders found");
    });

});

// Test to check rendering of failed payment status
test("payment status 'Failed' is rendered correctly", async () => {
    // Arrange: Mock axios.get to return failed payment order
    jest.clearAllMocks();
    const ordersWithFailedPayment = [
        {
            ...sampleGoodOrders()[0],
            payment: {success: false} // Set payment success to false, to simulate failed payment
        }
    ];
    axios.get.mockResolvedValueOnce({data: ordersWithFailedPayment});

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

// describe("fails gracefully for missing order fields", () => {
//     beforeEach(() => {
//         jest.clearAllMocks();
//         const baseOrder = sampleGoodOrders();
//     });
//
//     test("handles missing status field", async () => {
//         // Arrange: Create order with missing status
//         const ordersWithMissingStatus = [
//             {
//                 ...sampleGoodOrders()[0],
//                 status: undefined
//             }
//         ];
//         axios.get.mockResolvedValueOnce({data: ordersWithMissingStatus});
//
//         // Act: Render the Orders component
//         render(
//             <MemoryRouter>
//                 <Orders/>
//             </MemoryRouter>
//         );
//
//         // Assert: Check if component handles missing status gracefully
//         await waitFor(() => {
//             expect(screen.getByText("")).toBeInTheDocument(); // Expect empty string for missing status
//         });
//     });
//
//     test("handles missing buyer name", async () => {
//         // Arrange: Create order with missing buyer name
//         const ordersWithMissingBuyer = [
//             {
//                 ...sampleGoodOrders()[0],
//                 buyer: {}
//             }
//         ];
//         axios.get.mockResolvedValueOnce({data: ordersWithMissingBuyer});
//
//         // Act: Render the Orders component
//         render(
//             <MemoryRouter>
//                 <Orders/>
//             </MemoryRouter>
//         );
//
//         // Assert: Check if component handles missing buyer name gracefully
//         await waitFor(() => {
//             expect(screen.getByText("")).toBeInTheDocument(); // Expect empty string for missing name
//         });
//     });
//
//     test("handles missing payment field", async () => {
//         // Arrange: Create order with missing payment
//         const ordersWithMissingPayment = [
//             {
//                 ...sampleGoodOrders()[0],
//                 payment: undefined
//             }
//         ];
//         axios.get.mockResolvedValueOnce({data: ordersWithMissingPayment});
//
//         // Act: Render the Orders component
//         render(
//             <MemoryRouter>
//                 <Orders/>
//             </MemoryRouter>
//         );
//
//         // Assert: Check if component handles missing payment gracefully
//         await waitFor(() => {
//             expect(screen.getByText("")).toBeInTheDocument(); // Expect empty string for missing payment
//         });
//     });
//
//     test("handles missing products array", async () => {
//         // Arrange: Create order with missing products
//         const ordersWithMissingProducts = [
//             {
//                 ...sampleGoodOrders()[0],
//                 products: undefined
//             }
//         ];
//         axios.get.mockResolvedValueOnce({data: ordersWithMissingProducts});
//
//         // Act: Render the Orders component
//         render(
//             <MemoryRouter>
//                 <Orders/>
//             </MemoryRouter>
//         );
//
//         // Assert: Check if component handles missing products gracefully
//         await waitFor(() => {
//             expect(screen.getByTestId("order-quantity")).toHaveTextContent(""); // Expect empty string for missing products
//         });
//     });
// });
// Tests to check if order table headers are rendered correctly

