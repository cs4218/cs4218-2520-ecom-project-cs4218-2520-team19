// Sun Zhiyuan Felix (A0272474Y)

process.env.SUPPRESS_JEST_WARNINGS = 'true';

import React from 'react';
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from 'react-router-dom';
import Categories from "./Categories";
import useCategory from "../hooks/useCategory";

jest.mock("../hooks/useCategory");

jest.mock("../components/Layout", () => ({
  __esModule: true,
  default: ({ children }) => <div data-testid="layout">{children}</div>,
}));

describe("Categories Component", () => {
    afterEach(() => {  
        jest.clearAllMocks();
    });

    it("renders categories successfully", () => {
        const mockCategories = [
            { _id: "1", name: "Category 1", slug: "category-1" },
            { _id: "2", name: "Category 2", slug: "category-2" },
        ];
        useCategory.mockReturnValue(mockCategories);

        render(
            <MemoryRouter>
                <Categories />
            </MemoryRouter>
        );

        expect(screen.getByText("Category 1")).toBeInTheDocument();
        expect(screen.getByText("Category 2")).toBeInTheDocument();
        const links = screen.queryAllByRole("link");
        expect(links).toHaveLength(2);
    });

    it("renders no categories successfully", () => {
        const mockCategories = [];
        useCategory.mockReturnValue(mockCategories);

        render(
            <MemoryRouter>
                <Categories />
            </MemoryRouter>
        );

        const links = screen.queryAllByRole("link");
        expect(links).toHaveLength(0);
    });

    it("renders links for categories successfully", () => {
        const mockCategories = [
            { _id: "1", name: "Category 1", slug: "category-1" },
            { _id: "2", name: "Category 2", slug: "category-2" },
        ];
        useCategory.mockReturnValue(mockCategories);

        render(
            <MemoryRouter>
                <Categories />
            </MemoryRouter>
        );

        const links = screen.queryAllByRole("link");
        expect(links).toHaveLength(2);
        const link1 = screen.getByRole("link", { name: "Category 1" });
        const link2 = screen.getByRole("link", { name: "Category 2" });
        expect(link1).toHaveAttribute("href", "/category/category-1");
        expect(link2).toHaveAttribute("href", "/category/category-2");
    });

    it("renders layout component successfully", () => {
        const mockCategories = [
            { _id: "1", name: "Category 1", slug: "category-1" },
            { _id: "2", name: "Category 2", slug: "category-2" },
        ];
        useCategory.mockReturnValue(mockCategories);

        render(
            <MemoryRouter>
                <Categories />
            </MemoryRouter>
        );

        const layout = screen.getByTestId("layout");
        expect(layout).toBeInTheDocument();
    });
});