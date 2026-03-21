// Sun Zhiyuan Felix (A0272474Y)

import React from "react";
import { render, screen, within, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import axios from "axios";
import CreateCategory from "../pages/admin/CreateCategory";
import { AuthProvider } from "../context/auth";
import { CartProvider } from "../context/cart";
import { SearchProvider } from "../context/search";

jest.mock("axios");
jest.mock("react-hot-toast");

const mockCategories = [
  { _id: "cat1", name: "Electronics", slug: "electronics" },
  { _id: "cat2", name: "Clothing", slug: "clothing" },
];

function renderWithProviders(ui) {
  return render(
    <MemoryRouter>
      <AuthProvider>
        <CartProvider>
          <SearchProvider>{ui}</SearchProvider>
        </CartProvider>
      </AuthProvider>
    </MemoryRouter>
  );
}

describe("CreateCategory integration with frontend parts", () => {
  beforeEach(() => {
    axios.get.mockResolvedValue({
      data: { success: true, category: mockCategories },
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test("renders the Manage Category heading and create form", async () => {
    const { container } = renderWithProviders(<CreateCategory />);
    const main = container.querySelector("main");

    expect(await within(main).findByText("Manage Category")).toBeInTheDocument();
    expect(within(main).getByPlaceholderText("Enter new category")).toBeInTheDocument();
    expect(within(main).getByRole("button", { name: /submit/i })).toBeInTheDocument();
  });

  test("displays existing categories", async () => {
    const { container } = renderWithProviders(<CreateCategory />);
    const main = container.querySelector("main");

    expect(await within(main).findByText("Electronics")).toBeInTheDocument();
    expect(within(main).getByText("Clothing")).toBeInTheDocument();
    expect(within(main).getAllByRole("button", { name: /edit/i })).toHaveLength(2);
    expect(within(main).getAllByRole("button", { name: /delete/i })).toHaveLength(2);
  });

  test("creates category", async () => {
    axios.post.mockResolvedValue({ data: { success: true } });
    const { container } = renderWithProviders(<CreateCategory />);
    const main = container.querySelector("main");
    await within(main).findByText("Electronics");

    const input = within(main).getByPlaceholderText("Enter new category");
    fireEvent.change(input, { target: { value: "Books" } });
    fireEvent.click(within(main).getByRole("button", { name: /submit/i }));

    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith(
        "/api/v1/category/create-category",
        { name: "Books" }
      );
    });
  });

  test("opens edit modal pre-filled with the selected category name", async () => {
    const { container } = renderWithProviders(<CreateCategory />);
    const main = container.querySelector("main");
    await within(main).findByText("Electronics");

    const editButtons = within(main).getAllByRole("button", { name: /edit/i });
    fireEvent.click(editButtons[0]);

    const modal = await screen.findByRole("dialog");
    expect(within(modal).getByPlaceholderText("Enter new category")).toHaveValue("Electronics");
  });

  test("updates category", async () => {
    axios.put.mockResolvedValue({ data: { success: true } });
    const { container } = renderWithProviders(<CreateCategory />);
    const main = container.querySelector("main");
    await within(main).findByText("Electronics");

    const editButtons = within(main).getAllByRole("button", { name: /edit/i });
    fireEvent.click(editButtons[0]);
    const modal = await screen.findByRole("dialog");
    const modalInput = within(modal).getByPlaceholderText("Enter new category");
    fireEvent.change(modalInput, { target: { value: "Electronics Updated" } });
    fireEvent.click(within(modal).getByRole("button", { name: /submit/i }));

    await waitFor(() => {
      expect(axios.put).toHaveBeenCalledWith(
        "/api/v1/category/update-category/cat1",
        { name: "Electronics Updated" }
      );
    });
  });

  test("deletes category", async () => {
    axios.delete.mockResolvedValue({ data: { success: true } });
    const { container } = renderWithProviders(<CreateCategory />);
    const main = container.querySelector("main");
    await within(main).findByText("Electronics");
    
    const deleteButtons = within(main).getAllByRole("button", { name: /delete/i });
    fireEvent.click(deleteButtons[0]);

    await waitFor(() => {
      expect(axios.delete).toHaveBeenCalledWith(
        "/api/v1/category/delete-category/cat1"
      );
    });
  });
});
