import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import CreateProduct from "./CreateProduct";
import axios from "axios";
import { MemoryRouter } from "react-router-dom";
import React from "react";
import toast from "react-hot-toast";

// Mock axios
jest.mock("axios");
jest.mock("react-hot-toast");

// Mock react-router-dom
const mockNavigate = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(console, "log").mockImplementation(() => {});
  jest.spyOn(console, "error").mockImplementation(() => {});
});

afterAll(() => {
  console.log.mockRestore();
  console.error.mockRestore();
});

jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useParams: () => ({ slug: "clothing" }),
  useNavigate: () => mockNavigate,
}));

// Mock Layout
jest.mock("./../../components/Layout", () => ({ children }) => (
  <div data-testid="layout">{children}</div>
));

// Mock AdminMenu
jest.mock("./../../components/AdminMenu", () => () => (
  <div data-testid="admin-menu" />
));

it("should create product and navigate on success", async () => {
  axios.get.mockResolvedValueOnce({
    data: { success: true, category: [] },
  });

  axios.post.mockResolvedValueOnce({
    data: {
      success: true,
      message: "Product Created Successfully",
    },
  });

  render(
    <MemoryRouter>
      <CreateProduct />
    </MemoryRouter>,
  );

  const button = await screen.findByText("CREATE PRODUCT");
  fireEvent.click(button);

  await waitFor(() => {
    expect(toast.success).toHaveBeenCalledWith("Product Created Successfully");
    expect(mockNavigate).toHaveBeenCalledWith("/dashboard/admin/products");
  });
});

it("should show error toast when validation fails", async () => {
  axios.get.mockResolvedValueOnce({
    data: { success: true, category: [] },
  });

  axios.post.mockResolvedValueOnce({
    data: {
      message: "Name is Required",
    },
  });

  render(
    <MemoryRouter>
      <CreateProduct />
    </MemoryRouter>,
  );

  const button = await screen.findByText("CREATE PRODUCT");
  fireEvent.click(button);

  await waitFor(() => {
    expect(toast.error).toHaveBeenCalledWith("Name is Required");
  });

  expect(mockNavigate).not.toHaveBeenCalled();
});

it("should show error toast when request throws", async () => {
  axios.get.mockResolvedValueOnce({
    data: { success: true, category: [] },
  });

  axios.post.mockRejectedValueOnce(new Error("Network Error"));

  render(
    <MemoryRouter>
      <CreateProduct />
    </MemoryRouter>,
  );

  const button = await screen.findByText("CREATE PRODUCT");
  fireEvent.click(button);

  await waitFor(() => {
    expect(toast.error).toHaveBeenCalledWith("Something went wrong");
  });

  expect(mockNavigate).not.toHaveBeenCalled();
});

it("should render the Create Product heading", async () => {
  axios.get.mockResolvedValueOnce({
    data: { success: true, category: [{ _id: "cat1", name: "Electronics" }] },
  });

  render(
    <MemoryRouter>
      <CreateProduct />
    </MemoryRouter>,
  );

  expect(await screen.findByText("Create Product")).toBeInTheDocument();
});

it("should fetch and render categories on mount", async () => {
  axios.get.mockResolvedValueOnce({
    data: {
      success: true,
      category: [
        { _id: "cat1", name: "Electronics" },
        { _id: "cat2", name: "Clothing" },
      ],
    },
  });

  render(
    <MemoryRouter>
      <CreateProduct />
    </MemoryRouter>,
  );

  await waitFor(() => {
    expect(axios.get).toHaveBeenCalledWith("/api/v1/category/get-category");
  });
});

it("should show error toast when getAllCategory request fails", async () => {
  axios.get.mockRejectedValueOnce(new Error("Network Error"));

  render(
    <MemoryRouter>
      <CreateProduct />
    </MemoryRouter>,
  );

  await waitFor(() => {
    expect(toast.error).toHaveBeenCalledWith(
      "Something went wrong in getting catgeory",
    );
  });
});

it("should not set categories when getAllCategory returns success: false", async () => {
  axios.get.mockResolvedValueOnce({
    data: { success: false },
  });

  render(
    <MemoryRouter>
      <CreateProduct />
    </MemoryRouter>,
  );

  // categories should remain empty — no toast, no crash
  await waitFor(() => {
    expect(axios.get).toHaveBeenCalled();
  });
  expect(toast.error).not.toHaveBeenCalled();
});

it("should preview uploaded photo", async () => {
  axios.get.mockResolvedValueOnce({
    data: { success: true, category: [] },
  });

  render(
    <MemoryRouter>
      <CreateProduct />
    </MemoryRouter>,
  );

  const file = new File(["dummy"], "test.png", { type: "image/png" });

  // jsdom doesn't implement createObjectURL, so stub it
  global.URL.createObjectURL = jest.fn(() => "blob:test-url");

  const input = document.querySelector('input[type="file"]');
  fireEvent.change(input, { target: { files: [file] } });

  await waitFor(() => {
    expect(screen.getByAltText("product_photo")).toBeInTheDocument();
    expect(screen.getByAltText("product_photo")).toHaveAttribute(
      "src",
      "blob:test-url",
    );
  });

  // Label should now show the file name
  expect(screen.getByText("test.png")).toBeInTheDocument();
});

it("should update name, description, price, and quantity fields", async () => {
  axios.get.mockResolvedValueOnce({
    data: { success: true, category: [] },
  });

  render(
    <MemoryRouter>
      <CreateProduct />
    </MemoryRouter>,
  );

  fireEvent.change(screen.getByPlaceholderText("write a name"), {
    target: { value: "My Product" },
  });
  fireEvent.change(screen.getByPlaceholderText("write a description"), {
    target: { value: "A great product" },
  });
  fireEvent.change(screen.getByPlaceholderText("write a Price"), {
    target: { value: "99" },
  });
  fireEvent.change(screen.getByPlaceholderText("write a quantity"), {
    target: { value: "10" },
  });

  expect(screen.getByPlaceholderText("write a name")).toHaveValue("My Product");
  expect(screen.getByPlaceholderText("write a description")).toHaveValue(
    "A great product",
  );
  expect(screen.getByPlaceholderText("write a Price")).toHaveValue(99);
  expect(screen.getByPlaceholderText("write a quantity")).toHaveValue(10);
});

it("should append all fields to FormData and call axios.post", async () => {
  axios.get.mockResolvedValueOnce({
    data: { success: true, category: [] },
  });
  axios.post.mockResolvedValueOnce({
    data: { success: true },
  });

  const appendSpy = jest.spyOn(FormData.prototype, "append");

  render(
    <MemoryRouter>
      <CreateProduct />
    </MemoryRouter>,
  );
  fireEvent.change(screen.getByPlaceholderText("write a name"), {
    target: { value: "Widget" },
  });
  fireEvent.change(screen.getByPlaceholderText("write a Price"), {
    target: { value: "25" },
  });
  fireEvent.change(screen.getByPlaceholderText("write a quantity"), {
    target: { value: "5" },
  });

  fireEvent.click(screen.getByText("CREATE PRODUCT"));

  await waitFor(() => {
    expect(axios.post).toHaveBeenCalledWith(
      "/api/v1/product/create-product",
      expect.any(FormData),
    );
    expect(appendSpy).toHaveBeenCalledWith("name", "Widget");
    expect(appendSpy).toHaveBeenCalledWith("price", "25");
    expect(appendSpy).toHaveBeenCalledWith("quantity", "5");
  });

  appendSpy.mockRestore();
});
