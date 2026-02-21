// Sun Zhiyuan Felix (A0272474Y)

import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react";
import axios from "axios";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import "@testing-library/jest-dom/extend-expect";
import toast from "react-hot-toast";
import CreateCategory from "./CreateCategory";
import { describe } from "node:test";
import e from "cors";

jest.mock("axios");
jest.mock("react-hot-toast");
jest.mock("../../components/Layout", () => ({
  __esModule: true,
  default: ({ children }) => <div data-testid="layout">{children}</div>,
}));

describe("CreateCategory Component", () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    it("handles submit successfully", () => {
        axios.post.mockResolvedValue({ data: { success: true } });
        const { getByText, getByPlaceholderText } = render(
            <MemoryRouter initialEntries={['/admin/create-category']}>
                <Routes>
                    <Route path="/admin/create-category" element={<CreateCategory />} />
                </Routes>
            </MemoryRouter>
        );

        const nameInput = getByPlaceholderText("Enter Category Name");
        fireEvent.change(nameInput, { target: { value: "Test Category" } });

        const submitButton = getByText("Submit");
        fireEvent.click(submitButton);

        expect(axios.post).toHaveBeenCalledWith("/api/v1/category/create-category", {
            name: "Test Category",
        });
        expect(toast.success).toHaveBeenCalledWith("Category Created Successfully");
    });


    it ("renders CreateCategory component", () => {
        const { getByText } = render(
            <MemoryRouter initialEntries={['/admin/create-category']}>
                <Routes>
                    <Route path="/admin/create-category" element={<CreateCategory />} />
                </Routes>
            </MemoryRouter>
        );

        expect(getByText("Create Category")).toBeInTheDocument();
    });
});