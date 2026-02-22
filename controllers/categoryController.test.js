// Sun Zhiyuan Felix (A0272474Y)

import categoryModel from "../models/categoryModel.js";
import slugify from "slugify";
import * as categoryController from "./categoryController.js";

jest.mock("../models/categoryModel.js");
jest.mock("slugify", () => jest.fn((s) => s));

const mockResponse = () => {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.send = jest.fn().mockReturnValue(res);
    return res;
}

describe("createCategoryController", () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    test("successsful category creation", async () => {
        categoryModel.findOne = jest.fn().mockResolvedValue(null);
        const req = { body: { name: "New Category" } };
        const res = mockResponse();
        const mockCategory = { name: "New Category", slug: "new-category" };
        categoryModel.mockImplementation(() => ({ save: jest.fn().mockResolvedValue(mockCategory) }));
        
        await categoryController.createCategoryController(req, res);

        expect(slugify).toHaveBeenCalledWith("New Category");
        expect(res.status).toHaveBeenCalledWith(201);
        expect(res.send).toHaveBeenCalledWith({
            success: true,
            message: "New category created",
            category: mockCategory,
        });
    });

    test("category already exists", async () => {
        categoryModel.findOne = jest.fn().mockResolvedValue({ name: "Existing Category" });
        const req = { body: { name: "Existing Category" } };
        const res = mockResponse();

        await categoryController.createCategoryController(req, res);

        expect(slugify).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.send).toHaveBeenCalledWith({
            success: true,
            message: "Category Already Exists",
        });
    });

    test("no name given in request body", async () => {
        const req = { body: {} };
        const res = mockResponse();

        await categoryController.createCategoryController(req, res);

        expect(slugify).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.send).toHaveBeenCalledWith({
            message: "Name is required",
        });
    });

    test("error during category creation", async () => {
        jest.spyOn(console, "log").mockImplementation(() => {});

        const mockError = new Error("Database error");
        categoryModel.findOne = jest.fn().mockResolvedValue(null);
        const req = { body: { name: "Creation Fail" } };
        const res = mockResponse();
        categoryModel.mockImplementation(() => ({ save: jest.fn().mockRejectedValue(mockError) }));
        
        await categoryController.createCategoryController(req, res);

        expect(slugify).toHaveBeenCalledWith("Creation Fail");
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.send).toHaveBeenCalledWith({
            success: false,
            error: mockError,
            message: "Error in Category",
        });

        console.log.mockRestore();
    });

    test("error during category search", async () => {
        jest.spyOn(console, "log").mockImplementation(() => {});

        const mockError = new Error("Database error");
        categoryModel.findOne = jest.fn().mockRejectedValue(mockError);
        const req = { body: { name: "Search Fail" } };
        const res = mockResponse();

        await categoryController.createCategoryController(req, res);

        expect(slugify).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.send).toHaveBeenCalledWith({
            success: false,
            error: mockError,
            message: "Error in Category",
        });

        console.log.mockRestore();
    });
});

describe("updateCategoryController", () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    test("successful category update", async () => {
        const mockCategory = { name: "Updated Category", slug: "updated-category" };
        categoryModel.findByIdAndUpdate = jest.fn().mockResolvedValue(mockCategory);
        const req = { body: { name: "Updated Category" }, params: { id: "1" } };
        const res = mockResponse();

        await categoryController.updateCategoryController(req, res);

        expect(slugify).toHaveBeenCalledWith("Updated Category");
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.send).toHaveBeenCalledWith({
            success: true,
            message: "Category Updated Successfully",
            category: mockCategory,
        });
    });

    test("error during category update", async () => {
        jest.spyOn(console, "log").mockImplementation(() => {});

        const mockError = new Error("Database error");
        categoryModel.findByIdAndUpdate = jest.fn().mockRejectedValue(mockError);
        const req = { body: { name: "Updated Error" }, params: { id: "2" } };
        const res = mockResponse();

        await categoryController.updateCategoryController(req, res);

        expect(slugify).toHaveBeenCalledWith("Updated Error");
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.send).toHaveBeenCalledWith({
            success: false,
            error: mockError,
            message: "Error while updating category",
        });

        console.log.mockRestore();
    });
});

describe("categoryController", () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    test("successful retrieval of all categories", async () => {
        const mockCategories = [
            { name: "Category 1", slug: "category-1" }, 
            { name: "Category 2", slug: "category-2" }
        ];
        categoryModel.find = jest.fn().mockResolvedValue(mockCategories);
        const req = {};
        const res = mockResponse();

        await categoryController.categoryController(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.send).toHaveBeenCalledWith({
            success: true,
            message: "All Categories List",
            category: mockCategories,
        });
    });

    test("error during retrieval of all categories", async () => {
        jest.spyOn(console, "log").mockImplementation(() => {});

        const mockError = new Error("Database error");
        categoryModel.find = jest.fn().mockRejectedValue(mockError);
        const req = {};
        const res = mockResponse();

        await categoryController.categoryController(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.send).toHaveBeenCalledWith({
            success: false,
            error: mockError,
            message: "Error while getting all categories",
        });

        console.log.mockRestore();
    });
});

describe("singleCategoryController", () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    test("successful retrieval of a category", async () => {
        const mockCategory = { name: "Category 1", slug: "category-1" };
        categoryModel.findOne = jest.fn().mockResolvedValue(mockCategory);
        const req = { params: { slug: "category-1" } };
        const res = mockResponse();

        await categoryController.singleCategoryController(req, res);
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.send).toHaveBeenCalledWith({
            success: true,
            message: "Get Single Category Successfully",
            category: mockCategory,
        });
    });

    test("error during retrieval of a category", async () => {
        jest.spyOn(console, "log").mockImplementation(() => {});

        const mockError = new Error("Database error");
        categoryModel.findOne = jest.fn().mockRejectedValue(mockError);
        const req = { params: { slug: "category-1" } };
        const res = mockResponse();

        await categoryController.singleCategoryController(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.send).toHaveBeenCalledWith({
            success: false,
            error: mockError,
            message: "Error While getting Single Category",
        });

        console.log.mockRestore();
    });
});

describe("deleteCategoryController", () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    test("successful deletion of a category", async () => {
        categoryModel.findByIdAndDelete = jest.fn();
        const req = { params: { id: 1 } };
        const res = mockResponse();

        await categoryController.deleteCategoryController(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.send).toHaveBeenCalledWith({
            success: true,
            message: "Category Deleted Successfully",
        });
    });

    test("error during deletion of a category", async () => {
        jest.spyOn(console, "log").mockImplementation(() => {});

        const mockError = new Error("Database error");
        categoryModel.findByIdAndDelete = jest.fn().mockRejectedValue(mockError);
        const req = { params: { id: 1 } };
        const res = mockResponse();

        await categoryController.deleteCategoryController(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.send).toHaveBeenCalledWith({
            success: false,
            error: mockError,
            message: "Error while deleting category",
        });

        console.log.mockRestore();
    });
});