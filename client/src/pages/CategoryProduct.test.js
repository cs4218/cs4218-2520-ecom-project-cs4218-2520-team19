// Thanakorn Pawirunsiri, A0266315E

import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import CategoryProduct from "./CategoryProduct";
import axios from "axios";
import { MemoryRouter } from "react-router-dom";
import React from "react";

// Mock axios
jest.mock("axios");

// Mock react-router-dom
const mockNavigate = jest.fn();

jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useParams: () => ({ slug: "clothing" }),
  useNavigate: () => mockNavigate,
}));

// Mock Layout
jest.mock("./../components/Layout", () => ({ children }) => (
  <div data-testid="layout">{children}</div>
));

const mockResponse = {
  data: {
    category: { name: "Clothing" },
    products: [
      {
        _id: "1",
        name: "Test Product",
        price: 1000,
        description: "This is a test product description for testing",
        slug: "test-product",
      },
    ],
  },
};

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(console, "log").mockImplementation(() => {});
});

afterAll(() => {
  console.log.mockRestore();
});

it("should call API with correct category slug", async () => {
  axios.get.mockResolvedValue(mockResponse);

  render(
    <MemoryRouter>
      <CategoryProduct />
    </MemoryRouter>,
  );

  await waitFor(() => {
    expect(axios.get).toHaveBeenCalledWith(
      "/api/v1/product/product-category/clothing",
    );
  });
});

it("should render category name", async () => {
  axios.get.mockResolvedValue(mockResponse);

  render(
    <MemoryRouter>
      <CategoryProduct />
    </MemoryRouter>,
  );

  expect(await screen.findByText("Category - Clothing")).toBeInTheDocument();
});

it("should render product name", async () => {
  axios.get.mockResolvedValue(mockResponse);

  render(
    <MemoryRouter>
      <CategoryProduct />
    </MemoryRouter>,
  );

  expect(await screen.findByText("Test Product")).toBeInTheDocument();
});

it("should render formatted product price", async () => {
  axios.get.mockResolvedValue(mockResponse);

  render(
    <MemoryRouter>
      <CategoryProduct />
    </MemoryRouter>,
  );

  expect(await screen.findByText("$1,000.00")).toBeInTheDocument();
});

it("should render correct result count", async () => {
  axios.get.mockResolvedValue(mockResponse);

  render(
    <MemoryRouter>
      <CategoryProduct />
    </MemoryRouter>,
  );

  expect(await screen.findByText("1 result found")).toBeInTheDocument();
});

it("should navigate to product details when button clicked", async () => {
  axios.get.mockResolvedValue(mockResponse);

  render(
    <MemoryRouter>
      <CategoryProduct />
    </MemoryRouter>,
  );

  const button = await screen.findByText("More Details");
  fireEvent.click(button);

  expect(mockNavigate).toHaveBeenCalledWith("/product/test-product");
});

it("should render zero results correctly", async () => {
  axios.get.mockResolvedValue({
    data: {
      category: { name: "Clothing" },
      products: [],
    },
  });

  render(
    <MemoryRouter>
      <CategoryProduct />
    </MemoryRouter>,
  );

  expect(await screen.findByText("0 result found")).toBeInTheDocument();
});

it("should handle API error without crashing", async () => {
  axios.get.mockRejectedValue(new Error("API Error"));

  render(
    <MemoryRouter>
      <CategoryProduct />
    </MemoryRouter>,
  );

  await waitFor(() => {
    expect(axios.get).toHaveBeenCalled();
  });

  // Component should still render layout
  expect(screen.getByTestId("layout")).toBeInTheDocument();
});
