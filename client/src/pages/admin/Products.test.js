import { render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import Products from "./Products";
import axios from "axios";
import { MemoryRouter } from "react-router-dom";
import React from "react";
import toast from "react-hot-toast";

// Mock Axios
jest.mock("axios");
jest.mock("react-hot-toast");

// Mock react-router-dom
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => jest.fn(),
}));

// Mock Layout
jest.mock("./../../components/Layout", () => ({ children }) => (
  <div data-testid="layout">{children}</div>
));

// Mock AdminMenu
jest.mock("../../components/AdminMenu", () => () => (
  <div data-testid="admin-menu" />
));

const mockProducts = [
  {
    _id: "p1",
    name: "Product One",
    description: "Description One",
    slug: "product-one",
  },
  {
    _id: "p2",
    name: "Product Two",
    description: "Description Two",
    slug: "product-two",
  },
];

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(console, "log").mockImplementation(() => {});
});

afterAll(() => {
  console.log.mockRestore();
});

it("should render the All Products List heading", async () => {
  axios.get.mockResolvedValueOnce({ data: { products: [] } });

  render(
    <MemoryRouter>
      <Products />
    </MemoryRouter>,
  );

  expect(await screen.findByText("All Products List")).toBeInTheDocument();
});

it("should render Layout and AdminMenu", async () => {
  axios.get.mockResolvedValueOnce({ data: { products: [] } });

  render(
    <MemoryRouter>
      <Products />
    </MemoryRouter>,
  );

  expect(await screen.findByTestId("layout")).toBeInTheDocument();
  expect(screen.getByTestId("admin-menu")).toBeInTheDocument();
});

it("should fetch products on mount", async () => {
  axios.get.mockResolvedValueOnce({ data: { products: mockProducts } });

  render(
    <MemoryRouter>
      <Products />
    </MemoryRouter>,
  );

  await waitFor(() => {
    expect(axios.get).toHaveBeenCalledWith("/api/v1/product/get-product");
  });
});

it("should show error toast when getAllProducts throws", async () => {
  axios.get.mockRejectedValueOnce(new Error("Network Error"));

  render(
    <MemoryRouter>
      <Products />
    </MemoryRouter>,
  );

  await waitFor(() => {
    expect(toast.error).toHaveBeenCalledWith("Something Went Wrong");
  });
});

it("should log error when getAllProducts throws", async () => {
  const error = new Error("Network Error");
  axios.get.mockRejectedValueOnce(error);

  render(
    <MemoryRouter>
      <Products />
    </MemoryRouter>,
  );

  await waitFor(() => {
    expect(console.log).toHaveBeenCalledWith(error);
  });
});

it("should render a card for each product", async () => {
  axios.get.mockResolvedValueOnce({ data: { products: mockProducts } });

  render(
    <MemoryRouter>
      <Products />
    </MemoryRouter>,
  );

  expect(await screen.findByText("Product One")).toBeInTheDocument();
  expect(screen.getByText("Product Two")).toBeInTheDocument();
});

it("should render product descriptions", async () => {
  axios.get.mockResolvedValueOnce({ data: { products: mockProducts } });

  render(
    <MemoryRouter>
      <Products />
    </MemoryRouter>,
  );

  expect(await screen.findByText("Description One")).toBeInTheDocument();
  expect(screen.getByText("Description Two")).toBeInTheDocument();
});

it("should render product images with correct src and alt", async () => {
  axios.get.mockResolvedValueOnce({ data: { products: mockProducts } });

  render(
    <MemoryRouter>
      <Products />
    </MemoryRouter>,
  );

  const imgOne = await screen.findByAltText("Product One");
  const imgTwo = screen.getByAltText("Product Two");

  expect(imgOne).toHaveAttribute("src", "/api/v1/product/product-photo/p1");
  expect(imgTwo).toHaveAttribute("src", "/api/v1/product/product-photo/p2");
});

it("should render links pointing to the correct product edit pages", async () => {
  axios.get.mockResolvedValueOnce({ data: { products: mockProducts } });

  render(
    <MemoryRouter>
      <Products />
    </MemoryRouter>,
  );

  await screen.findByText("Product One");

  const links = screen.getAllByRole("link");
  const hrefs = links.map((l) => l.getAttribute("href"));

  expect(hrefs).toContain("/dashboard/admin/product/product-one");
  expect(hrefs).toContain("/dashboard/admin/product/product-two");
});

it("should render no product cards when products list is empty", async () => {
  axios.get.mockResolvedValueOnce({ data: { products: [] } });

  render(
    <MemoryRouter>
      <Products />
    </MemoryRouter>,
  );

  await waitFor(() => {
    expect(axios.get).toHaveBeenCalled();
  });

  expect(screen.queryByRole("link")).not.toBeInTheDocument();
});
