import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import UpdateProduct from "./UpdateProduct";
import axios from "axios";
import { MemoryRouter } from "react-router-dom";
import React from "react";
import toast from "react-hot-toast";

// Mock axios
jest.mock("axios");
jest.mock("react-hot-toast");

// Mock react-router-dom
const mockNavigate = jest.fn();

jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useParams: () => ({ slug: "test-product" }),
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

const mockProduct = {
  _id: "123",
  name: "Test Product",
  description: "Test Description",
  price: 99,
  quantity: 10,
  shipping: true,
  category: { _id: "123", name: "Electronics" },
};

const mockCategories = [
  { _id: "123", name: "Electronics" },
  { _id: "456", name: "Clothing" },
];

const mockGetCalls = (productOverride = {}, categorySuccess = true) => {
  axios.get
    .mockResolvedValueOnce({
      data: { product: { ...mockProduct, ...productOverride } },
    })
    .mockResolvedValueOnce({
      data: { success: categorySuccess, category: mockCategories },
    });
};

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(console, "log").mockImplementation(() => {});
  jest.spyOn(console, "error").mockImplementation(() => {});
  global.URL.createObjectURL = jest.fn(() => "blob:test-url");
});

afterAll(() => {
  console.log.mockRestore();
  console.error.mockRestore();
});

it("should render the Update Product heading", async () => {
  mockGetCalls();

  render(
    <MemoryRouter>
      <UpdateProduct />
    </MemoryRouter>,
  );

  expect(await screen.findByText("Update Product")).toBeInTheDocument();
});

it("should render UPDATE PRODUCT and DELETE PRODUCT buttons", async () => {
  mockGetCalls();

  render(
    <MemoryRouter>
      <UpdateProduct />
    </MemoryRouter>,
  );

  expect(await screen.findByText("UPDATE PRODUCT")).toBeInTheDocument();
  expect(screen.getByText("DELETE PRODUCT")).toBeInTheDocument();
});

it("should fetch single product on mount and populate fields", async () => {
  mockGetCalls();

  render(
    <MemoryRouter>
      <UpdateProduct />
    </MemoryRouter>,
  );

  await waitFor(() => {
    expect(axios.get).toHaveBeenCalledWith(
      "/api/v1/product/get-product/test-product",
    );
  });

  expect(await screen.findByDisplayValue("Test Product")).toBeInTheDocument();
  expect(screen.getByDisplayValue("Test Description")).toBeInTheDocument();
  expect(screen.getByDisplayValue("99")).toBeInTheDocument();
  expect(screen.getByDisplayValue("10")).toBeInTheDocument();
});

it("should log error when getSingleProduct request fails", async () => {
  axios.get
    .mockRejectedValueOnce(new Error("Network Error"))
    .mockResolvedValueOnce({
      data: { success: true, category: mockCategories },
    });

  render(
    <MemoryRouter>
      <UpdateProduct />
    </MemoryRouter>,
  );

  await waitFor(() => {
    expect(console.log).toHaveBeenCalledWith(expect.any(Error));
  });
});

it("should fetch categories on mount", async () => {
  mockGetCalls();

  render(
    <MemoryRouter>
      <UpdateProduct />
    </MemoryRouter>,
  );

  await waitFor(() => {
    expect(axios.get).toHaveBeenCalledWith("/api/v1/category/get-category");
  });
});

it("should show error toast when getAllCategory request throws", async () => {
  axios.get
    .mockResolvedValueOnce({
      data: { product: mockProduct },
    })
    .mockRejectedValueOnce(new Error("Network Error"));

  render(
    <MemoryRouter>
      <UpdateProduct />
    </MemoryRouter>,
  );

  await waitFor(() => {
    expect(toast.error).toHaveBeenCalledWith(
      "Something went wrong in getting catgeory",
    );
  });
});

it("should not set categories when getAllCategory returns success: false", async () => {
  mockGetCalls({}, false);

  render(
    <MemoryRouter>
      <UpdateProduct />
    </MemoryRouter>,
  );

  await waitFor(() => {
    expect(axios.get).toHaveBeenCalledWith("/api/v1/category/get-category");
  });

  expect(toast.error).not.toHaveBeenCalled();
});

it("should show existing product photo from API when no new photo is uploaded", async () => {
  mockGetCalls();

  render(
    <MemoryRouter>
      <UpdateProduct />
    </MemoryRouter>,
  );

  await screen.findByDisplayValue("Test Product");
  const img = screen.getByAltText("product_photo");
  expect(img).toHaveAttribute("src", "/api/v1/product/product-photo/123");
});

it("should preview newly uploaded photo and show filename", async () => {
  mockGetCalls();

  render(
    <MemoryRouter>
      <UpdateProduct />
    </MemoryRouter>,
  );

  await screen.findByText("UPDATE PRODUCT");

  const file = new File(["dummy"], "new-photo.png", { type: "image/png" });
  const input = document.querySelector('input[type="file"]');
  fireEvent.change(input, { target: { files: [file] } });

  await waitFor(() => {
    expect(screen.getByAltText("product_photo")).toHaveAttribute(
      "src",
      "blob:test-url",
    );
  });

  expect(screen.getByText("new-photo.png")).toBeInTheDocument();
});

it("should update name, description, price and quantity fields", async () => {
  mockGetCalls();

  render(
    <MemoryRouter>
      <UpdateProduct />
    </MemoryRouter>,
  );

  await screen.findByDisplayValue("Test Product");

  fireEvent.change(screen.getByPlaceholderText("write a name"), {
    target: { value: "Updated Product" },
  });
  fireEvent.change(screen.getByPlaceholderText("write a description"), {
    target: { value: "Updated Description" },
  });
  fireEvent.change(screen.getByPlaceholderText("write a Price"), {
    target: { value: "199" },
  });
  fireEvent.change(screen.getByPlaceholderText("write a quantity"), {
    target: { value: "20" },
  });

  expect(screen.getByPlaceholderText("write a name")).toHaveValue(
    "Updated Product",
  );
  expect(screen.getByPlaceholderText("write a description")).toHaveValue(
    "Updated Description",
  );
  expect(screen.getByPlaceholderText("write a Price")).toHaveValue(199);
  expect(screen.getByPlaceholderText("write a quantity")).toHaveValue(20);
});

it("should call axios.put with correct URL and FormData on update", async () => {
  mockGetCalls();
  axios.put.mockResolvedValueOnce({ data: { success: true } });

  const appendSpy = jest.spyOn(FormData.prototype, "append");

  render(
    <MemoryRouter>
      <UpdateProduct />
    </MemoryRouter>,
  );

  await screen.findByDisplayValue("Test Product");
  fireEvent.click(screen.getByText("UPDATE PRODUCT"));

  await waitFor(() => {
    expect(axios.put).toHaveBeenCalledWith(
      "/api/v1/product/update-product/123",
      expect.any(FormData),
    );
    expect(appendSpy).toHaveBeenCalledWith("name", "Test Product");
    expect(appendSpy).toHaveBeenCalledWith("description", "Test Description");
    expect(appendSpy).toHaveBeenCalledWith("price", 99);
    expect(appendSpy).toHaveBeenCalledWith("quantity", 10);
    expect(appendSpy).toHaveBeenCalledWith("category", "123");
  });

  appendSpy.mockRestore();
});

it("should NOT append photo to FormData when no photo is selected", async () => {
  mockGetCalls();
  axios.put.mockResolvedValueOnce({ data: { success: true } });

  const appendSpy = jest.spyOn(FormData.prototype, "append");

  render(
    <MemoryRouter>
      <UpdateProduct />
    </MemoryRouter>,
  );

  await screen.findByDisplayValue("Test Product");
  fireEvent.click(screen.getByText("UPDATE PRODUCT"));

  await waitFor(() => {
    expect(axios.put).toHaveBeenCalled();
  });

  expect(appendSpy).not.toHaveBeenCalledWith("photo", expect.anything());
  appendSpy.mockRestore();
});

it("should append photo to FormData when a photo is selected", async () => {
  mockGetCalls();
  axios.put.mockResolvedValueOnce({ data: { success: true } });

  const appendSpy = jest.spyOn(FormData.prototype, "append");

  render(
    <MemoryRouter>
      <UpdateProduct />
    </MemoryRouter>,
  );

  await screen.findByDisplayValue("Test Product");

  const file = new File(["dummy"], "upload.png", { type: "image/png" });
  const input = document.querySelector('input[type="file"]');
  fireEvent.change(input, { target: { files: [file] } });

  fireEvent.click(screen.getByText("UPDATE PRODUCT"));

  await waitFor(() => {
    expect(appendSpy).toHaveBeenCalledWith("photo", file);
  });

  appendSpy.mockRestore();
});

it("should show toast.success and navigate when product is updated successfully", async () => {
  mockGetCalls();
  axios.put.mockResolvedValueOnce({ data: { success: true } });

  render(
    <MemoryRouter>
      <UpdateProduct />
    </MemoryRouter>,
  );

  await screen.findByDisplayValue("Test Product");
  fireEvent.click(screen.getByText("UPDATE PRODUCT"));

  await waitFor(() => {
    expect(toast.success).toHaveBeenCalledWith("Product Updated Successfully");
    expect(mockNavigate).toHaveBeenCalledWith("/dashboard/admin/products");
  });
});

it("should show error toast when handleUpdate throws", async () => {
  mockGetCalls();
  axios.put.mockRejectedValueOnce(new Error("Server Error"));

  render(
    <MemoryRouter>
      <UpdateProduct />
    </MemoryRouter>,
  );

  await screen.findByDisplayValue("Test Product");
  fireEvent.click(screen.getByText("UPDATE PRODUCT"));

  await waitFor(() => {
    expect(toast.error).toHaveBeenCalledWith("Something went wrong");
  });

  expect(mockNavigate).not.toHaveBeenCalled();
});

it("should show error toast with message when update returns success: false", async () => {
  mockGetCalls();
  axios.put.mockResolvedValueOnce({
    data: { success: false, message: "Validation failed" },
  });

  render(
    <MemoryRouter>
      <UpdateProduct />
    </MemoryRouter>,
  );

  await screen.findByDisplayValue("Test Product");
  fireEvent.click(screen.getByText("UPDATE PRODUCT"));

  await waitFor(() => {
    expect(toast.error).toHaveBeenCalledWith("Validation failed");
  });

  expect(mockNavigate).not.toHaveBeenCalled();
});

it("should delete product and navigate when user confirms prompt", async () => {
  mockGetCalls();
  jest.spyOn(window, "prompt").mockReturnValue("yes");
  axios.delete.mockResolvedValueOnce({ data: { success: true } });

  render(
    <MemoryRouter>
      <UpdateProduct />
    </MemoryRouter>,
  );

  await screen.findByDisplayValue("Test Product");
  fireEvent.click(screen.getByText("DELETE PRODUCT"));

  await waitFor(() => {
    expect(axios.delete).toHaveBeenCalledWith(
      "/api/v1/product/delete-product/123",
    );
    expect(toast.success).toHaveBeenCalledWith("Product Deleted Successfully");
    expect(mockNavigate).toHaveBeenCalledWith("/dashboard/admin/products");
  });

  window.prompt.mockRestore();
});

it("should not delete product when user cancels the prompt", async () => {
  mockGetCalls();
  jest.spyOn(window, "prompt").mockReturnValue(null);

  render(
    <MemoryRouter>
      <UpdateProduct />
    </MemoryRouter>,
  );

  await screen.findByText("DELETE PRODUCT");
  fireEvent.click(screen.getByText("DELETE PRODUCT"));

  await waitFor(() => {
    expect(window.prompt).toHaveBeenCalled();
  });

  expect(axios.delete).not.toHaveBeenCalled();
  expect(mockNavigate).not.toHaveBeenCalled();

  window.prompt.mockRestore();
});

it("should show error toast when handleDelete throws", async () => {
  mockGetCalls();
  jest.spyOn(window, "prompt").mockReturnValue("yes");
  axios.delete.mockRejectedValueOnce(new Error("Delete failed"));

  render(
    <MemoryRouter>
      <UpdateProduct />
    </MemoryRouter>,
  );

  await screen.findByText("DELETE PRODUCT");
  fireEvent.click(screen.getByText("DELETE PRODUCT"));

  await waitFor(() => {
    expect(toast.error).toHaveBeenCalledWith("Something went wrong");
  });

  expect(mockNavigate).not.toHaveBeenCalled();

  window.prompt.mockRestore();
});
