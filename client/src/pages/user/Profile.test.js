import React from 'react';
import '@testing-library/jest-dom/extend-expect';
import Profile from './Profile';
import {screen, render, fireEvent, waitFor} from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

import axios from 'axios';
import toast from 'react-hot-toast';


// Mocking axios
jest.mock('axios');
jest.mock('react-hot-toast');

// Mock useAuth hook to simulate authenticated user
jest.mock('../../context/auth', () => ({
    useAuth: jest.fn(() => [{token: "fake-token"}, jest.fn()]) // Mock useAuth hook to return a fake token and a mock function for setAuth
}));

jest.mock('../../context/cart', () => ({
    useCart: jest.fn(() => [null, jest.fn()]) // Mock useCart hook to return null state and a mock function
}));

jest.mock('../../context/search', () => ({
    useSearch: jest.fn(() => [{ keyword: '' }, jest.fn()]) // Mock useSearch hook to return null state and a mock function
}));

jest.mock('../../components/UserMenu', () => () => <div>UserMenu</div>); // Mock UserMenu component

const useAuth = require('../../context/auth').useAuth;
const mockSetAuth = jest.fn();
const setAuthUser = (user) => {
    useAuth.mockReturnValue([{token: "fake-token", user: user}, mockSetAuth]);
}

const mockUser = {
    name: "John Doe",
    email: "John@gmail.com",
    phone: "1234567890",
    address: "123 Street",
};

const updatedUser = {
    name: "Jane Doe",
    phone: "0987654321",
    address: "456 Avenue",
    password: "newpassword123",
};

Object.defineProperty(window, 'localStorage', {
    value: {
      setItem: jest.fn(),
      getItem: jest.fn(() => JSON.stringify({token: 'fake-token', user: mockUser })),
      removeItem: jest.fn(),
    },
    writable: true,
  });

describe("Profile Component mounting", () => {
    beforeEach(() => {
        jest.clearAllMocks();
            setAuthUser(mockUser);
    });

    test("renders profile form with needed fields", () => {
        axios.get.mockResolvedValueOnce({data: {user: mockUser}});
        const { getByText, getByDisplayValue } = render(
            <MemoryRouter>
                <Profile />
            </MemoryRouter>
        );

        expect(getByText("USER PROFILE")).toBeInTheDocument();
        expect(screen.getByPlaceholderText("Enter Your Name")).toBeInTheDocument();
        expect(screen.getByPlaceholderText("Enter Your Email")).toBeInTheDocument();
        expect(screen.getByPlaceholderText("Enter Your Password")).toBeInTheDocument();
        expect(screen.getByPlaceholderText("Enter Your Phone")).toBeInTheDocument();
        expect(screen.getByPlaceholderText("Enter Your Address")).toBeInTheDocument();
    });

    test("inputs should initially contain user data from context", () => {
        axios.get.mockResolvedValueOnce({data: {user: mockUser}});
        const {getByDisplayValue } = render(
            <MemoryRouter>
                <Profile />
            </MemoryRouter>
        );
        expect(getByDisplayValue("John Doe")).toBeInTheDocument();
        expect(getByDisplayValue("John@gmail.com")).toBeInTheDocument();
        expect(getByDisplayValue("1234567890")).toBeInTheDocument();
        expect(getByDisplayValue("123 Street")).toBeInTheDocument();
    });
});

describe ("Profile Component interactions", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        setAuthUser(mockUser);
    });

    test("allows user to type in the input fields", () => {
        axios.get .mockResolvedValueOnce({data: {user: mockUser}});
        const {getByPlaceholderText} = render(
            <MemoryRouter>
                <Profile/>
            </MemoryRouter>
        );
        fireEvent.change(getByPlaceholderText("Enter Your Name"), {target: {value: "Jane Doe"}});
        fireEvent.change(getByPlaceholderText("Enter Your Password"), {target: {value: "newpassword123"}});
        fireEvent.change(getByPlaceholderText("Enter Your Phone"), {target: {value: "0987654321"}});
        fireEvent.change(getByPlaceholderText("Enter Your Address"), {target: {value: "456 Avenue"}});

        expect(getByPlaceholderText("Enter Your Name").value).toBe("Jane Doe");
        expect(getByPlaceholderText("Enter Your Password").value).toBe("newpassword123");
        expect(getByPlaceholderText("Enter Your Phone").value).toBe("0987654321");
        expect(getByPlaceholderText("Enter Your Address").value).toBe("456 Avenue");
    });

    test("email input should be disabled", () => {
        axios.get.mockResolvedValueOnce({data: {user: mockUser}});
        const {getByPlaceholderText} = render(
            <MemoryRouter>
                <Profile/>
            </MemoryRouter>
        );
        expect(getByPlaceholderText("Enter Your Email")).toBeDisabled();
    });

    test("password input should be empty initially", () => {
        axios.get.mockResolvedValueOnce({data: {user: mockUser}});
        const {getByPlaceholderText} = render(
            <MemoryRouter>
                <Profile/>
            </MemoryRouter>
        );
        expect(getByPlaceholderText("Enter Your Password").value).toBe("");
    });

    test("updates auth context after successful profile update", async () => {
        const mockSetAuth = jest.fn();
        useAuth.mockReturnValue([{user: mockUser}, mockSetAuth]);

        axios.put.mockResolvedValueOnce({data: {updatedUser: updatedUser}});
        axios.get.mockResolvedValueOnce({data: {user: mockUser}});

        const {getByPlaceholderText, getByText} = render(
            <MemoryRouter>
                <Profile/>
            </MemoryRouter>
        );

        fireEvent.change(getByPlaceholderText("Enter Your Name"), {target: {value: "Jane Doe"}});
        fireEvent.change(getByPlaceholderText("Enter Your Password"), {target: {value: "newpassword123"}});
        fireEvent.change(getByPlaceholderText("Enter Your Phone"), {target: {value: "0987654321"}});
        fireEvent.change(getByPlaceholderText("Enter Your Address"), {target: {value: "456 Avenue"}});

        fireEvent.click(getByText("UPDATE"));

        await waitFor(() => expect(mockSetAuth).toHaveBeenCalledWith(expect.objectContaining({
            user: expect.objectContaining({
                name: "Jane Doe",
                password: "newpassword123",
                phone: "0987654321",
                address: "456 Avenue",
            }),
        })));
    });

    test("updates localStorage after successful profile update", async () => {
        axios.put.mockResolvedValueOnce({data: {updatedUser: updatedUser}});
        axios.get.mockResolvedValueOnce({data: {user: mockUser}});

        const {getByPlaceholderText, getByText} = render(
            <MemoryRouter>
                <Profile/>
            </MemoryRouter>
        );

        fireEvent.change(getByPlaceholderText("Enter Your Name"), {target: {value: "Jane Doe"}});
        fireEvent.change(getByPlaceholderText("Enter Your Password"), {target: {value: "newpassword123"}});
        fireEvent.change(getByPlaceholderText("Enter Your Phone"), {target: {value: "0987654321"}});
        fireEvent.change(getByPlaceholderText("Enter Your Address"), {target: {value: "456 Avenue"}});

        fireEvent.click(getByText("UPDATE"));

        await waitFor(() => expect(window.localStorage.setItem).toHaveBeenCalledWith(
            "auth",
            JSON.stringify({token: "fake-token", user: updatedUser})
        ));
    });

    test("updates the profile successfully", async () => {
        axios.put.mockResolvedValueOnce({data: {updatedUser: updatedUser}});
        axios.get.mockResolvedValueOnce({data: {user: mockUser}});

        const {getByPlaceholderText, getByText} = render(
            <MemoryRouter>
                <Profile/>
            </MemoryRouter>
        );

        fireEvent.change(getByPlaceholderText("Enter Your Name"), {target: {value: "Jane Doe"}});
        fireEvent.change(getByPlaceholderText("Enter Your Password"), {target: {value: "newpassword123"}});
        fireEvent.change(getByPlaceholderText("Enter Your Phone"), {target: {value: "0987654321"}});
        fireEvent.change(getByPlaceholderText("Enter Your Address"), {target: {value: "456 Avenue"}});

        fireEvent.click(getByText("UPDATE"));

        await waitFor(() => expect(axios.put).toHaveBeenCalledWith("/api/v1/auth/profile", {
            name: "Jane Doe",
            password: "newpassword123",
            phone: "0987654321",
            address: "456 Avenue",
        }));
        expect(toast.success).toHaveBeenCalledWith("Profile Updated Successfully");
    });

        test("if field not provided, old value should be sent in the update request", async () => {
        axios.put.mockResolvedValueOnce({data: {updatedUser: updatedUser}});
        axios.get.mockResolvedValueOnce({data: {user: mockUser}});

        const {getByPlaceholderText, getByText} = render(
            <MemoryRouter>
                <Profile/>
            </MemoryRouter>
        );

        fireEvent.change(getByPlaceholderText("Enter Your Name"), {target: {value: "Jane Doe"}});

        fireEvent.click(getByText("UPDATE"));

        await waitFor(() => expect(axios.put).toHaveBeenCalledWith("/api/v1/auth/profile", {
            name: "Jane Doe",
            password: "",
            phone: "1234567890",
            address: "123 Street",
        }));
    });

    test("if no changes made, update should still succeed with old values", async () => {
        axios.put.mockResolvedValueOnce({data: {updatedUser: mockUser}});
        axios.get.mockResolvedValueOnce({data: {user: mockUser}});

        const {getByText} = render(
            <MemoryRouter>
                <Profile/>
            </MemoryRouter>
        );

        fireEvent.click(getByText("UPDATE"));

        await waitFor(() => expect(axios.put).toHaveBeenCalledWith("/api/v1/auth/profile", {
            name: "John Doe",
            password: "",
            phone: "1234567890",
            address: "123 Street",
        }));
        expect(toast.success).toHaveBeenCalledWith("Profile Updated Successfully");
    });

    test("displays error message on database error during profile update", async () => {
        axios.put.mockResolvedValueOnce({data: {error: "Something went wrong"}});
        axios.get.mockResolvedValueOnce({data: {user: mockUser}});

        const {getByPlaceholderText, getByText} = render(
            <MemoryRouter>
                <Profile/>
            </MemoryRouter>
        );

        fireEvent.change(getByPlaceholderText("Enter Your Name"), {target: {value: "Jane Doe"}});
        fireEvent.change(getByPlaceholderText("Enter Your Password"), {target: {value: "newpassword123"}});
        fireEvent.change(getByPlaceholderText("Enter Your Phone"), {target: {value: "0987654321"}});
        fireEvent.change(getByPlaceholderText("Enter Your Address"), {target: {value: "456 Avenue"}});

        fireEvent.click(getByText("UPDATE"));

        await waitFor(() => expect(axios.put).toHaveBeenCalled());
        expect(toast.error).toHaveBeenCalledWith("Something went wrong");
    });

    test("displays error message on network error during profile update", async () => {
        axios.put.mockRejectedValueOnce(new Error("Network Error"));
        axios.get.mockResolvedValueOnce({data: {user: mockUser}});

        const {getByPlaceholderText, getByText} = render(
            <MemoryRouter>
                <Profile/>
            </MemoryRouter>
        );

        fireEvent.change(getByPlaceholderText("Enter Your Name"), {target: {value: "Jane Doe"}});
        fireEvent.change(getByPlaceholderText("Enter Your Password"), {target: {value: "newpassword123"}});
        fireEvent.change(getByPlaceholderText("Enter Your Phone"), {target: {value: "0987654321"}});
        fireEvent.change(getByPlaceholderText("Enter Your Address"), {target: {value: "456 Avenue"}});

        fireEvent.click(getByText("UPDATE"));

        await waitFor(() => expect(axios.put).toHaveBeenCalled());
        expect(toast.error).toHaveBeenCalledWith("Something went wrong");
    });
});

test("updates form fields after auth user data changes, useEffect dependency test", async () => {
    axios.get.mockResolvedValueOnce({data: {user: mockUser}});

    setAuthUser(mockUser);

    const {rerender } = render(
        <MemoryRouter>
            <Profile />
        </MemoryRouter>
    );

    // rerender the component with updated user data in auth context
    setAuthUser(updatedUser);
    rerender(
        <MemoryRouter>
            <Profile />
        </MemoryRouter>
    );

    expect(screen.getByPlaceholderText("Enter Your Name").value).toBe("Jane Doe");
    expect(screen.getByPlaceholderText("Enter Your Phone").value).toBe("0987654321");
    expect(screen.getByPlaceholderText("Enter Your Address").value).toBe("456 Avenue");
});

