// Sun Zhiyuan Felix (A0272474Y)

import React from "react"; 
import { render, fireEvent, screen } from "@testing-library/react";
import CategoryForm from "./CategoryForm";

describe("CategoryForm Component", () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    it("renders category form successfully", () => {
        const { getByPlaceholderText } = render(<CategoryForm />);

        expect(getByPlaceholderText("Enter new category")).toBeInTheDocument();
    });

    it("input should be initially empty", () => {
        const { getByPlaceholderText } = render(<CategoryForm />); 

        expect(getByPlaceholderText("Enter new category").value).toBe("");
    });

    it("calls handleSubmit when form is submitted", () => {
        const mockHandleSubmit = jest.fn((e) => e.preventDefault());
        const mockSetValue = jest.fn();
        
        render(
            <CategoryForm 
                handleSubmit={mockHandleSubmit}
                setValue={mockSetValue} 
            />
        ); 

        const submitButton = screen.getByRole("button", { type: "submit" });
        fireEvent.click(submitButton);
        expect(mockHandleSubmit).toHaveBeenCalled();
    });

    it("calls setValue when input value changes", () => {
        const mockHandleSubmit = jest.fn((e) => e.preventDefault());
        const mockSetValue = jest.fn();

        render(
            <CategoryForm 
                handleSubmit={mockHandleSubmit}
                setValue={mockSetValue} 
            />
        );

        const input = screen.getByPlaceholderText("Enter new category");
        fireEvent.change(input, { target: { value: "New Category" } });
        expect(mockSetValue).toHaveBeenCalledWith("New Category");
    });

});