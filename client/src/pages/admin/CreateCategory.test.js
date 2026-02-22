// Sun Zhiyuan Felix (A0272474Y)

import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import "@testing-library/jest-dom/extend-expect";
import AdminMenu from "./../../components/AdminMenu";
import toast from "react-hot-toast";
import axios from "axios";
import CreateCategory from "./CreateCategory";
import CategoryForm from "../../components/Form/CategoryForm";
import { describe } from "node:test";
import { error } from "console";
import { message } from "antd";

jest.mock("axios");
jest.mock("react-hot-toast");
jest.mock("../../components/Layout", () => ({
  __esModule: true,
  default: ({ children }) => <div data-testid="layout">{children}</div>,
}));
jest.mock("../../components/AdminMenu", () => ({
  __esModule: true,
  default: () => <div data-testid="admin-menu" />,
}));
jest.mock("../../hooks/useCategory", () => jest.fn(() => []));

describe("CreateCategory Component", () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    it("renders CreateCategory component", async () => {
        axios.get.mockResolvedValueOnce({
            data: { 
                success: true, 
                category: [
                    { _id: "1", name: "Render Test 1" },
                    { _id: "2", name: "Render Test 2" }
                ] 
            },
        });

        const { getByText } = render(
            <MemoryRouter initialEntries={['/admin/create-category']}>
                <Routes>
                    <Route path="/admin/create-category" element={<CreateCategory />} />
                </Routes>
            </MemoryRouter>
        );

        await waitFor(() => {
            expect(axios.get).toHaveBeenCalledWith("/api/v1/category/get-category");
            expect(screen.getByText("Render Test 1")).toBeInTheDocument();
            expect(screen.getByText("Render Test 2")).toBeInTheDocument();
        });
    });

    it("handles getting all category data returning {success: false}", async () => {
        axios.get.mockResolvedValueOnce({
            data: { success: false, message: "Failed to fetch categories" }
        });

        const { getByText } = render(
            <MemoryRouter initialEntries={['/admin/create-category']}>
                <Routes>
                    <Route path="/admin/create-category" element={<CreateCategory />} />
                </Routes>
            </MemoryRouter>
        );

        await waitFor(() => {
            expect(axios.get).toHaveBeenCalledWith("/api/v1/category/get-category");
            expect(toast.error).toHaveBeenCalledWith("Failed to fetch categories");
        });
    });

    it("handles error when getting all category", async () => {
        jest.spyOn(console, "log").mockImplementation(() => {});

        axios.get.mockRejectedValueOnce(new Error("Error in fetching categories"));

        const { getByText } = render(
            <MemoryRouter initialEntries={['/admin/create-category']}>
                <Routes>
                    <Route path="/admin/create-category" element={<CreateCategory />} />
                </Routes>
            </MemoryRouter>
        );

        await waitFor(() => {
            expect(axios.get).toHaveBeenCalledWith("/api/v1/category/get-category");
            expect(toast.error).toHaveBeenCalledWith("Something went wrong in getting category");
        });

        console.log.mockRestore();
    });

    it("handles category creation successfully", async () => {
        axios.get.mockResolvedValueOnce({
            data: { 
                success: true, 
                category: [
                    { _id: "1", name: "Existing 1" },
                    { _id: "2", name: "Existing 2" }
                ] 
            },
        });
        axios.post.mockResolvedValueOnce({
            data: { success: true },
        });
        axios.get.mockResolvedValueOnce({
            data: { 
                success: true,
                category: [
                    { _id: "1", name: "Existing 1" },
                    { _id: "2", name: "Existing 2" },
                    { _id: "3", name: "New Category" }
                ]
            },
        });

        const { getByText } = render(
            <MemoryRouter initialEntries={['/admin/create-category']}>
                <Routes>
                    <Route path="/admin/create-category" element={<CreateCategory />} />
                </Routes>
            </MemoryRouter>
        );
        await waitFor(() => { // Waiting for async getAllCategory to finish, not part of test assertions
            expect(screen.getByText("Existing 1")).toBeInTheDocument();
            expect(screen.getByText("Existing 2")).toBeInTheDocument();
        });
        fireEvent.change(screen.getByPlaceholderText("Enter new category"), { target: { value: "New Category" } });
        fireEvent.click(getByText("Submit"));

        await waitFor(() => {
            expect(axios.get).toHaveBeenCalledWith("/api/v1/category/get-category");
            expect(axios.post).toHaveBeenCalledWith("/api/v1/category/create-category", { name: "New Category" });
            expect(toast.success).toHaveBeenCalledWith("New Category is created");
            expect(screen.getByText("Existing 1")).toBeInTheDocument();
            expect(screen.getByText("Existing 2")).toBeInTheDocument();
            expect(screen.getByText("New Category")).toBeInTheDocument();
        });
    });

    it("handles creating category returning {success: false}", async () => {
        axios.get.mockResolvedValueOnce({
            data: { 
                success: true, 
                category: [
                    { _id: "1", name: "Existing 1" },
                    { _id: "2", name: "Existing 2" }
                ] 
            },
        });
        axios.post.mockResolvedValueOnce({
            data: { success: false, message: "Failed to create category" },
        });

        const { getByText } = render(
            <MemoryRouter initialEntries={['/admin/create-category']}>
                <Routes>
                    <Route path="/admin/create-category" element={<CreateCategory />} />
                </Routes>
            </MemoryRouter>
        );
        await waitFor(() => { // Waiting for async getAllCategory to finish, not part of test assertions
            expect(screen.getByText("Existing 1")).toBeInTheDocument();
            expect(screen.getByText("Existing 2")).toBeInTheDocument();
        });
        fireEvent.change(screen.getByPlaceholderText("Enter new category"), { target: { value: "New Category" } });
        fireEvent.click(getByText("Submit"));

        await waitFor(() => {
            expect(axios.get).toHaveBeenCalledWith("/api/v1/category/get-category");
            expect(axios.post).toHaveBeenCalledWith("/api/v1/category/create-category", { name: "New Category" });
            expect(toast.error).toHaveBeenCalledWith("Failed to create category");
            expect(screen.getByText("Existing 1")).toBeInTheDocument();
            expect(screen.getByText("Existing 2")).toBeInTheDocument();
        });
    });

    it("handles error during category creation", async () => {
        jest.spyOn(console, "log").mockImplementation(() => {});

        axios.get.mockResolvedValueOnce({
            data: { 
                success: true, 
                category: [
                    { _id: "1", name: "Existing 1" },
                    { _id: "2", name: "Existing 2" }
                ] 
            },
        });
        axios.post.mockRejectedValueOnce(new Error("Error in creating category"));

        const { getByText } = render(
            <MemoryRouter initialEntries={['/admin/create-category']}>
                <Routes>
                    <Route path="/admin/create-category" element={<CreateCategory />} />
                </Routes>
            </MemoryRouter>
        );
        await waitFor(() => { // Waiting for async getAllCategory to finish, not part of test assertions
            expect(screen.getByText("Existing 1")).toBeInTheDocument();
            expect(screen.getByText("Existing 2")).toBeInTheDocument();
        });
        fireEvent.change(screen.getByPlaceholderText("Enter new category"), { target: { value: "New Category" } });
        fireEvent.click(getByText("Submit"));

        await waitFor(() => {
            expect(axios.get).toHaveBeenCalledWith("/api/v1/category/get-category");
            expect(axios.post).toHaveBeenCalledWith("/api/v1/category/create-category", { name: "New Category" });
            expect(toast.error).toHaveBeenCalledWith("Something went wrong in creating category");
            expect(screen.getByText("Existing 1")).toBeInTheDocument();
            expect(screen.getByText("Existing 2")).toBeInTheDocument();
        });

        console.log.mockRestore();
    });

    it("renders modal component successfully", async () => {
        axios.get.mockResolvedValueOnce({
            data: { 
                success: true, 
                category: [
                    { _id: "1", name: "Modal Category" },
                ] 
            },
        });

        const { getByText } = render(
            <MemoryRouter initialEntries={['/admin/create-category']}>
                <Routes>
                    <Route path="/admin/create-category" element={<CreateCategory />} />
                </Routes>
            </MemoryRouter>
        );
        await waitFor(() => { // Waiting for async getAllCategory to finish, not part of test assertions
            expect(screen.getByText("Modal Category")).toBeInTheDocument();
        });
        expect(screen.queryByDisplayValue("Modal Category")).not.toBeInTheDocument();
        fireEvent.click(getByText("Edit"));

        await waitFor(() => {
            expect(screen.getByDisplayValue("Modal Category")).toBeInTheDocument();
        });
    });

    it("closes modal component successfully", async () => {
        axios.get.mockResolvedValueOnce({
            data: { 
                success: true, 
                category: [
                    { _id: "1", name: "Modal Category" },
                ] 
            },
        });

        const { getByText } = render(
            <MemoryRouter initialEntries={['/admin/create-category']}>
                <Routes>
                    <Route path="/admin/create-category" element={<CreateCategory />} />
                </Routes>
            </MemoryRouter>
        );
        await waitFor(() => { // Waiting for async getAllCategory to finish, not part of test assertions
            expect(screen.getByText("Modal Category")).toBeInTheDocument();
        });
        expect(screen.queryByDisplayValue("Modal Category")).not.toBeInTheDocument();
        fireEvent.click(getByText("Edit"));
        await waitFor(() => { // Waiting for modal to render, not part of test assertions
            expect(screen.getByDisplayValue("Modal Category")).toBeInTheDocument();
        });
        fireEvent.click(screen.getByRole("button", { name: "Close" }));

        await waitFor(() => {
            expect(screen.queryByDisplayValue("Modal Category")).not.toBeVisible();
        });
    });

    it("handles category update successfully", async () => {
        const updatedCategory = { _id: "1", name: "Updated 1" };
        axios.get.mockResolvedValueOnce({
            data: { 
                success: true, 
                category: [
                    { _id: "1", name: "Old 1" },
                    { _id: "2", name: "Old 2" }
                ] 
            },
        });
        axios.put.mockResolvedValueOnce({
            data: { success: true },
        });
        axios.get.mockResolvedValueOnce({
            data: { 
                success: true,
                category: [
                    updatedCategory,
                    { _id: "2", name: "Old 2" },
                ]
            },
        });

        const { getByText } = render(
            <MemoryRouter initialEntries={['/admin/create-category']}>
                <Routes>
                    <Route path="/admin/create-category" element={<CreateCategory />} />
                </Routes>
            </MemoryRouter>
        );
        await waitFor(() => { // Waiting for async getAllCategory to finish, not part of test assertions
            expect(screen.getByText("Old 1")).toBeInTheDocument();
            expect(screen.getByText("Old 2")).toBeInTheDocument();
        });
        const editButtons = screen.getAllByRole("button", { name: "Edit" });
        fireEvent.click(editButtons[0]);
        await waitFor(() => { // Waiting for modal to render, not part of test assertions
            expect(screen.getByDisplayValue("Old 1")).toBeInTheDocument();
        });
        fireEvent.change(screen.getByDisplayValue("Old 1"), { target: { value: updatedCategory.name } });
        const submitButtons = screen.getAllByRole("button", { name: "Submit" });
        fireEvent.click(submitButtons[1]);

        await waitFor(() => {
            expect(axios.get).toHaveBeenCalledWith("/api/v1/category/get-category");
            expect(axios.put).toHaveBeenCalledWith("/api/v1/category/update-category/1", { name: updatedCategory.name });
            expect(toast.success).toHaveBeenCalledWith(`${updatedCategory.name} is updated`);
            expect(screen.getByText(updatedCategory.name)).toBeInTheDocument();
            expect(screen.getByText("Old 2")).toBeInTheDocument();
        });
    });

    it("closes modal after successful update", async () => {
        const updatedCategory = { _id: "1", name: "Updated 1" };
        axios.get.mockResolvedValueOnce({
            data: { 
                success: true, 
                category: [
                    { _id: "1", name: "Old 1" },
                    { _id: "2", name: "Old 2" }
                ] 
            },
        });
        axios.put.mockResolvedValueOnce({
            data: { success: true },
        });
        axios.get.mockResolvedValueOnce({
            data: { 
                success: true,
                category: [
                    updatedCategory,
                    { _id: "2", name: "Old 2" },
                ]
            },
        });

        const { getByText } = render(
            <MemoryRouter initialEntries={['/admin/create-category']}>
                <Routes>
                    <Route path="/admin/create-category" element={<CreateCategory />} />
                </Routes>
            </MemoryRouter>
        );

        await waitFor(() => { // Waiting for async getAllCategory to finish, not part of test assertions
            expect(screen.getByText("Old 1")).toBeInTheDocument();
            expect(screen.getByText("Old 2")).toBeInTheDocument();
        });
        const editButtons = screen.getAllByRole("button", { name: "Edit" });
        fireEvent.click(editButtons[0]);
        await waitFor(() => { // Waiting for modal to render, not part of test assertions
            expect(screen.getByDisplayValue("Old 1")).toBeInTheDocument();
        });
        fireEvent.change(screen.getByDisplayValue("Old 1"), { target: { value: updatedCategory.name } });
        const submitButtons = screen.getAllByRole("button", { name: "Submit" });
        fireEvent.click(submitButtons[1]);

        await waitFor(() => {
            expect(axios.get).toHaveBeenCalledWith("/api/v1/category/get-category");
            expect(axios.put).toHaveBeenCalledWith("/api/v1/category/update-category/1", { name: updatedCategory.name });
            expect(toast.success).toHaveBeenCalledWith(`${updatedCategory.name} is updated`);
            expect(screen.getByText(updatedCategory.name)).toBeInTheDocument();
            expect(screen.getByText("Old 2")).toBeInTheDocument();
            expect(screen.queryByDisplayValue(updatedCategory.name)).not.toBeVisible();
        });
    });

    it("handles updating category returning {success: false}", async () => {
        const updatedCategory = { _id: "1", name: "Updated 1" };
        axios.get.mockResolvedValueOnce({
            data: { 
                success: true, 
                category: [
                    { _id: "1", name: "Old 1" },
                    { _id: "2", name: "Old 2" }
                ] 
            },
        });
        axios.put.mockResolvedValueOnce({
            data: { success: false, message: "Failed to update category" },
        });

        const { getByText } = render(
            <MemoryRouter initialEntries={['/admin/create-category']}>
                <Routes>
                    <Route path="/admin/create-category" element={<CreateCategory />} />
                </Routes>
            </MemoryRouter>
        );
        await waitFor(() => { // Waiting for async getAllCategory to finish, not part of test assertions
            expect(screen.getByText("Old 1")).toBeInTheDocument();
        });
        const editButtons = screen.getAllByRole("button", { name: "Edit" });
        fireEvent.click(editButtons[0]);
        await waitFor(() => { // Waiting for modal to render, not part of test assertions
            expect(screen.getByDisplayValue("Old 1")).toBeInTheDocument();
        });
        fireEvent.change(screen.getByDisplayValue("Old 1"), { target: { value: updatedCategory.name } });
        const submitButtons = screen.getAllByRole("button", { name: "Submit" });
        fireEvent.click(submitButtons[1]);

        await waitFor(() => {
            expect(axios.get).toHaveBeenCalledWith("/api/v1/category/get-category");
            expect(axios.put).toHaveBeenCalledWith("/api/v1/category/update-category/1", { name: updatedCategory.name });
            expect(toast.error).toHaveBeenCalledWith("Failed to update category");
        });
    });

    it("handles error during category update", async () => {
        jest.spyOn(console, "log").mockImplementation(() => {});

        const updatedCategory = { _id: "1", name: "Updated 1" };
        axios.get.mockResolvedValueOnce({
            data: { 
                success: true, 
                category: [
                    { _id: "1", name: "Old 1" },
                    { _id: "2", name: "Old 2" }
                ] 
            },
        });
        axios.put.mockRejectedValueOnce(new Error("Error in updating category"));

        const { getByText } = render(
            <MemoryRouter initialEntries={['/admin/create-category']}>
                <Routes>
                    <Route path="/admin/create-category" element={<CreateCategory />} />
                </Routes>
            </MemoryRouter>
        );
        await waitFor(() => { // Waiting for async getAllCategory to finish, not part of test assertions
            expect(screen.getByText("Old 1")).toBeInTheDocument();
        });
        const editButtons = screen.getAllByRole("button", { name: "Edit" });
        fireEvent.click(editButtons[0]);
        await waitFor(() => { // Waiting for modal to render, not part of test assertions
            expect(screen.getByDisplayValue("Old 1")).toBeInTheDocument();
        });
        fireEvent.change(screen.getByDisplayValue("Old 1"), { target: { value: updatedCategory.name } });
        const submitButtons = screen.getAllByRole("button", { name: "Submit" });
        fireEvent.click(submitButtons[1]);

        await waitFor(() => {
            expect(axios.get).toHaveBeenCalledWith("/api/v1/category/get-category");
            expect(axios.put).toHaveBeenCalledWith("/api/v1/category/update-category/1", { name: updatedCategory.name });
            expect(toast.error).toHaveBeenCalledWith("Something went wrong in updating category");
        });

        console.log.mockRestore();
    });

    it("handles category deletion successfully", async () => {
        axios.get.mockResolvedValueOnce({
            data: { 
                success: true, 
                category: [
                    { _id: "1", name: "Delete 1" },
                    { _id: "2", name: "Delete 2" }
                ] 
            },
        });
        axios.delete.mockResolvedValueOnce({
            data: { success: true },
        });
        axios.get.mockResolvedValueOnce({
            data: { 
                success: true,
                category: [
                    { _id: "2", name: "Delete 2" },
                ]
            },
        });

        const { getByText } = render(
            <MemoryRouter initialEntries={['/admin/create-category']}>
                <Routes>
                    <Route path="/admin/create-category" element={<CreateCategory />} />
                </Routes>
            </MemoryRouter>
        );
        await waitFor(() => { // Waiting for async getAllCategory to finish, not part of test assertions
            expect(screen.getByText("Delete 1")).toBeInTheDocument();
            expect(screen.getByText("Delete 2")).toBeInTheDocument();
        });
        const deleteButtons = screen.getAllByRole("button", { name: "Delete" });
        fireEvent.click(deleteButtons[0]);

        await waitFor(() => {
            expect(axios.get).toHaveBeenCalledWith("/api/v1/category/get-category");
            expect(axios.delete).toHaveBeenCalledWith("/api/v1/category/delete-category/1");
            expect(toast.success).toHaveBeenCalledWith("category is deleted");
            expect(screen.queryByText("Delete 1")).not.toBeInTheDocument();
            expect(screen.getByText("Delete 2")).toBeInTheDocument();
        });
    });

    it("handles deleting category returning {success: false}", async () => {
        axios.get.mockResolvedValueOnce({
            data: { 
                success: true, 
                category: [
                    { _id: "1", name: "Delete 1" },
                    { _id: "2", name: "Delete 2" }
                ] 
            },
        });
        axios.delete.mockResolvedValueOnce({
            data: { success: false, message: "Failed to delete category" },
        });
        
        const { getByText } = render(
            <MemoryRouter initialEntries={['/admin/create-category']}>
                <Routes>
                    <Route path="/admin/create-category" element={<CreateCategory />} />
                </Routes>
            </MemoryRouter>
        );
        await waitFor(() => { // Waiting for async getAllCategory to finish, not part of test assertions
            expect(screen.getByText("Delete 1")).toBeInTheDocument();
            expect(screen.getByText("Delete 2")).toBeInTheDocument();
        });
        const deleteButtons = screen.getAllByRole("button", { name: "Delete" });
        fireEvent.click(deleteButtons[0]);

        await waitFor(() => {
            expect(axios.get).toHaveBeenCalledWith("/api/v1/category/get-category");
            expect(axios.delete).toHaveBeenCalledWith("/api/v1/category/delete-category/1");
            expect(toast.error).toHaveBeenCalledWith("Failed to delete category");
            expect(screen.getByText("Delete 1")).toBeInTheDocument();
            expect(screen.getByText("Delete 2")).toBeInTheDocument();
        });
    });

    it("handles error during category deletion", async () => {
        jest.spyOn(console, "log").mockImplementation(() => {});

        axios.get.mockResolvedValueOnce({
            data: { 
                success: true, 
                category: [
                    { _id: "1", name: "Delete 1" },
                    { _id: "2", name: "Delete 2" }
                ] 
            },
        });
        axios.delete.mockRejectedValueOnce(new Error("Error in deleting category"));
        
        const { getByText } = render(
            <MemoryRouter initialEntries={['/admin/create-category']}>
                <Routes>
                    <Route path="/admin/create-category" element={<CreateCategory />} />
                </Routes>
            </MemoryRouter>
        );
        await waitFor(() => { // Waiting for async getAllCategory to finish, not part of test assertions
            expect(screen.getByText("Delete 1")).toBeInTheDocument();
            expect(screen.getByText("Delete 2")).toBeInTheDocument();
        });
        const deleteButtons = screen.getAllByRole("button", { name: "Delete" });
        fireEvent.click(deleteButtons[0]);

        await waitFor(() => {
            expect(axios.get).toHaveBeenCalledWith("/api/v1/category/get-category");
            expect(axios.delete).toHaveBeenCalledWith("/api/v1/category/delete-category/1");
            expect(toast.error).toHaveBeenCalledWith("Something went wrong in deleting category");
            expect(screen.getByText("Delete 1")).toBeInTheDocument();
            expect(screen.getByText("Delete 2")).toBeInTheDocument();
        });

        console.log.mockRestore();
    });
});