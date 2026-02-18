const {
  createProductController,
  getProductController,
  getSingleProductController,
  productPhotoController,
  deleteProductController,
  updateProductController,
  productFiltersController,
  productCountController,
  productListController,
  searchProductController,
  realtedProductController,
  productCategoryController,
} = require("./productController");
const productModel = require("../models/productModel");
const categoryModel = require("../models/categoryModel");
const fs = require("fs");
const slugify = require("slugify");

// mocks

jest.mock("../models/productModel", () => {
  const mockProduct = jest.fn();
  mockProduct.find = jest.fn();
  return mockProduct;
});

jest.mock("../models/categoryModel", () => {
  const mockCategory = jest.fn();
  return mockCategory;
});

jest.mock("fs", () => ({
  readFileSync: jest.fn(),
}));

jest.mock("slugify", () => jest.fn());

const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.send = jest.fn();
  res.set = jest.fn();
  return res;
};

describe("createProductController", () => {
  let saveMock;

  beforeEach(() => {
    jest.clearAllMocks();

    saveMock = jest.fn();
    productModel.mockImplementation(() => ({
      save: saveMock,
      photo: {},
    }));
  });

  it("should create product successfully", async () => {
    slugify.mockReturnValue("test-product");
    fs.readFileSync.mockReturnValue(Buffer.from("image"));
    saveMock.mockResolvedValue(true);

    const req = {
      fields: {
        name: "Test Product",
        description: "Test Desc",
        price: 100,
        category: "cat123",
        quantity: 10,
        shipping: true,
      },
      files: {
        photo: {
          path: "/tmp/photo.png",
          type: "image/png",
          size: 500000,
        },
      },
    };

    const res = mockRes();

    await createProductController(req, res);

    expect(slugify).toHaveBeenCalledWith("Test Product");
    expect(fs.readFileSync).toHaveBeenCalled();
    expect(saveMock).toHaveBeenCalled();

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.send).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        message: "Product Created Successfully",
      }),
    );
  });

  it("should return error if name is missing", async () => {
    const req = {
      fields: {
        description: "Test",
        price: 100,
        category: "cat",
        quantity: 1,
      },
      files: {},
    };

    const res = mockRes();

    await createProductController(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith({
      error: "Name is Required",
    });
  });

  it("should return error if description is missing", async () => {
    const req = {
      fields: {
        name: "Test",
        price: 100,
        category: "cat",
        quantity: 1,
      },
      files: {},
    };

    const res = mockRes();

    await createProductController(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith({
      error: "Description is Required",
    });
  });

  it("should return error if price is missing", async () => {
    const req = {
      fields: {
        name: "Test",
        description: "Test",
        category: "cat",
        quantity: 1,
      },
      files: {},
    };

    const res = mockRes();

    await createProductController(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith({
      error: "Price is Required",
    });
  });

  it("should return error if category is missing", async () => {
    const req = {
      fields: {
        name: "Test",
        description: "Test",
        price: 100,
        quantity: 1,
      },
      files: {},
    };

    const res = mockRes();

    await createProductController(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith({
      error: "Category is Required",
    });
  });

  it("should return error if quantity is missing", async () => {
    const req = {
      fields: {
        name: "Test",
        description: "Test",
        price: 100,
        category: "cat",
      },
      files: {},
    };

    const res = mockRes();

    await createProductController(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith({
      error: "Quantity is Required",
    });
  });

  it("should reject photo larger than 1mb", async () => {
    const req = {
      fields: {
        name: "Test",
        description: "Desc",
        price: 100,
        category: "cat",
        quantity: 1,
      },
      files: {
        photo: {
          size: 2000000,
        },
      },
    };

    const res = mockRes();

    await createProductController(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith({
      error: "Photo is required and should be less than 1mb",
    });
  });

  it("should return error if fs.readFileSync throws", async () => {
    slugify.mockReturnValue("test-product");

    fs.readFileSync.mockImplementation(() => {
      throw new Error("File read error");
    });

    saveMock.mockResolvedValue(true);

    const req = {
      fields: {
        name: "Test",
        description: "Desc",
        price: 100,
        category: "cat",
        quantity: 1,
      },
      files: {
        photo: {
          path: "/bad/path.png",
          type: "image/png",
          size: 500000,
        },
      },
    };

    const res = mockRes();

    await createProductController(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });
});

describe("getProductController", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return products successfully", async () => {
    const mockProducts = [
      { _id: "1", name: "Product 1" },
      { _id: "2", name: "Product 2" },
    ];

    productModel.mockImplementation(() => ({
      find: jest.fn(),
    }));

    const mockQuery = {
      populate: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      sort: jest.fn().mockResolvedValue(mockProducts),
    };

    productModel.find.mockReturnValue(mockQuery);

    const req = {};
    const res = mockRes();

    await getProductController(req, res);

    expect(productModel.find).toHaveBeenCalledWith({});
    expect(mockQuery.populate).toHaveBeenCalledWith("category");
    expect(mockQuery.select).toHaveBeenCalledWith("-photo");
    expect(mockQuery.limit).toHaveBeenCalledWith(12);
    expect(mockQuery.sort).toHaveBeenCalledWith({ createdAt: -1 });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith({
      success: true,
      counTotal: mockProducts.length,
      message: "AllProducts",
      products: mockProducts,
    });
  });

  it("should throw an error if an error is thrown", async () => {
    productModel.mockImplementation(() => ({
      find: jest.fn(),
    }));

    productModel.find.mockImplementation(() => {
      throw new Error("Something went wrong");
    });

    const req = {};
    const res = mockRes();

    await getProductController(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith({
      success: false,
      message: "Error in getting products",
      error: "Something went wrong",
    });
  });
});

describe("getSingleProductController", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return the product correctly", async () => {
    const mockProduct = { _id: "1", name: "Product 1", slug: "product-1" };

    const mockQuery = {
      select: jest.fn().mockReturnThis(),
      populate: jest.fn().mockResolvedValue(mockProduct),
    };

    productModel.findOne = jest.fn().mockReturnValue(mockQuery);

    const req = { params: { slug: "product-1" } };
    const res = mockRes();

    await getSingleProductController(req, res);

    expect(productModel.findOne).toHaveBeenCalledWith({ slug: "product-1" });
    expect(mockQuery.select).toHaveBeenCalledWith("-photo");
    expect(mockQuery.populate).toHaveBeenCalledWith("category");
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith({
      success: true,
      message: "Single Product Fetched",
      product: mockProduct,
    });
  });

  it("should throw an error if an error is thrown", async () => {
    productModel.mockImplementation(() => ({
      findOne: jest.fn(),
    }));

    productModel.findOne.mockImplementation(() => {
      throw new Error("Something went wrong");
    });

    const req = { params: { slug: "product-1" } };
    const res = mockRes();

    await getSingleProductController(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith({
      success: false,
      message: "Error in getting single product",
      error: "Something went wrong",
    });
  });
});

describe("productPhotoController", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return product photo successfully", async () => {
    const mockPhotoBuffer = Buffer.from("fake-image-data");

    const mockProduct = {
      photo: {
        data: mockPhotoBuffer,
        contentType: "image/png",
      },
    };

    productModel.findById = jest.fn().mockReturnValue({
      select: jest.fn().mockResolvedValue(mockProduct),
    });

    const req = { params: { pid: "123" } };
    const res = mockRes();

    await productPhotoController(req, res);

    expect(productModel.findById).toHaveBeenCalledWith("123");
    expect(res.set).toHaveBeenCalledWith("Content-type", "image/png");
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith(mockPhotoBuffer);
  });

  it("should throw an error if an error is thrown", async () => {
    productModel.mockImplementation(() => ({
      findById: jest.fn(),
    }));

    productModel.findById.mockImplementation(() => {
      throw new Error("Something went wrong");
    });

    const req = { params: { pid: 1 } };
    const res = mockRes();

    await productPhotoController(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith({
      success: false,
      message: "Error in getting photo",
      error: "Something went wrong",
    });
  });
});

describe("deleteProductController", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should delete product successfully", async () => {
    productModel.findByIdAndDelete = jest.fn().mockReturnValue({
      select: jest.fn().mockResolvedValue(true),
    });

    const req = { params: { pid: "123" } };
    const res = mockRes();

    await deleteProductController(req, res);

    expect(productModel.findByIdAndDelete).toHaveBeenCalledWith("123");
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith({
      success: true,
      message: "Product Deleted Successfully",
    });
  });

  it("should throw an error if an error is thrown", async () => {
    productModel.findByIdAndDelete = jest.fn().mockImplementation(() => {
      throw new Error("Something went wrong");
    });

    const req = { params: { pid: "123" } };
    const res = mockRes();

    await deleteProductController(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith({
      success: false,
      message: "Error in deleting product",
      error: expect.objectContaining({
        message: "Something went wrong",
      }),
    });
  });
});

describe("updateProductController", () => {
  let saveMock;
  let mockProduct;

  beforeEach(() => {
    jest.clearAllMocks();

    saveMock = jest.fn();
    mockProduct = {
      save: saveMock,
      photo: {},
    };

    productModel.findByIdAndUpdate = jest.fn();
  });

  it("should update product successfully", async () => {
    slugify.mockReturnValue("test-product");
    fs.readFileSync.mockReturnValue(Buffer.from("image"));
    productModel.findByIdAndUpdate.mockResolvedValue(mockProduct);
    saveMock.mockResolvedValue(true);

    const req = {
      params: { pid: "123" },
      fields: {
        name: "Test Product",
        description: "Test Desc",
        price: 100,
        category: "cat123",
        quantity: 10,
        shipping: true,
      },
      files: {
        photo: {
          path: "/tmp/photo.png",
          type: "image/png",
          size: 500000,
        },
      },
    };

    const res = mockRes();

    await updateProductController(req, res);

    expect(slugify).toHaveBeenCalledWith("Test Product");
    expect(productModel.findByIdAndUpdate).toHaveBeenCalledWith(
      "123",
      expect.objectContaining({
        name: "Test Product",
        slug: "test-product",
      }),
      { new: true },
    );
    expect(fs.readFileSync).toHaveBeenCalled();
    expect(saveMock).toHaveBeenCalled();

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.send).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        message: "Product Updated Successfully",
      }),
    );
  });

  it("should return error if name is missing", async () => {
    const req = {
      params: { pid: "123" },
      fields: {
        description: "Test",
        price: 100,
        category: "cat",
        quantity: 1,
      },
      files: {},
    };

    const res = mockRes();

    await updateProductController(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith({
      error: "Name is Required",
    });
  });

  it("should return error if description is missing", async () => {
    const req = {
      params: { pid: "123" },
      fields: {
        name: "Test",
        price: 100,
        category: "cat",
        quantity: 1,
      },
      files: {},
    };

    const res = mockRes();

    await updateProductController(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith({
      error: "Description is Required",
    });
  });

  it("should return error if price is missing", async () => {
    const req = {
      params: { pid: "123" },
      fields: {
        name: "Test",
        description: "Test",
        category: "cat",
        quantity: 1,
      },
      files: {},
    };

    const res = mockRes();

    await updateProductController(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith({
      error: "Price is Required",
    });
  });

  it("should return error if category is missing", async () => {
    const req = {
      params: { pid: "123" },
      fields: {
        name: "Test",
        description: "Test",
        price: 100,
        quantity: 1,
      },
      files: {},
    };

    const res = mockRes();

    await updateProductController(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith({
      error: "Category is Required",
    });
  });

  it("should return error if quantity is missing", async () => {
    const req = {
      params: { pid: "123" },
      fields: {
        name: "Test",
        description: "Test",
        price: 100,
        category: "cat",
      },
      files: {},
    };

    const res = mockRes();

    await updateProductController(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith({
      error: "Quantity is Required",
    });
  });

  it("should reject photo larger than 1mb", async () => {
    const req = {
      params: { pid: "123" },
      fields: {
        name: "Test",
        description: "Desc",
        price: 100,
        category: "cat",
        quantity: 1,
      },
      files: {
        photo: {
          size: 2000000,
        },
      },
    };

    const res = mockRes();

    await updateProductController(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith({
      error: "Photo is required and should be less then 1mb",
    });
  });

  it("should return error if findByIdAndUpdate throws", async () => {
    slugify.mockReturnValue("test-product");
    productModel.findByIdAndUpdate.mockImplementation(() => {
      throw new Error("Database error");
    });

    const req = {
      params: { pid: "123" },
      fields: {
        name: "Test",
        description: "Desc",
        price: 100,
        category: "cat",
        quantity: 1,
      },
      files: {},
    };

    const res = mockRes();

    await updateProductController(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith({
      success: false,
      error: "Database error",
      message: "Error in updating product",
    });
  });
});

describe("productFiltersController", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should filter products by category only", async () => {
    const mockProducts = [
      { _id: "1", name: "Product 1", category: "cat1" },
      { _id: "2", name: "Product 2", category: "cat1" },
    ];

    productModel.find = jest.fn().mockResolvedValue(mockProducts);

    const req = {
      body: {
        checked: ["cat1", "cat2"],
        radio: [],
      },
    };

    const res = mockRes();

    await productFiltersController(req, res);

    expect(productModel.find).toHaveBeenCalledWith({
      category: ["cat1", "cat2"],
    });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith({
      success: true,
      products: mockProducts,
    });
  });

  it("should filter products by price range only", async () => {
    const mockProducts = [
      { _id: "1", name: "Product 1", price: 50 },
      { _id: "2", name: "Product 2", price: 75 },
    ];

    productModel.find = jest.fn().mockResolvedValue(mockProducts);

    const req = {
      body: {
        checked: [],
        radio: [10, 100],
      },
    };

    const res = mockRes();

    await productFiltersController(req, res);

    expect(productModel.find).toHaveBeenCalledWith({
      price: { $gte: 10, $lte: 100 },
    });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith({
      success: true,
      products: mockProducts,
    });
  });

  it("should filter products by both category and price range", async () => {
    const mockProducts = [
      { _id: "1", name: "Product 1", category: "cat1", price: 50 },
    ];

    productModel.find = jest.fn().mockResolvedValue(mockProducts);

    const req = {
      body: {
        checked: ["cat1"],
        radio: [10, 100],
      },
    };

    const res = mockRes();

    await productFiltersController(req, res);

    expect(productModel.find).toHaveBeenCalledWith({
      category: ["cat1"],
      price: { $gte: 10, $lte: 100 },
    });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith({
      success: true,
      products: mockProducts,
    });
  });

  it("should return all products when no filters applied", async () => {
    const mockProducts = [
      { _id: "1", name: "Product 1" },
      { _id: "2", name: "Product 2" },
      { _id: "3", name: "Product 3" },
    ];

    productModel.find = jest.fn().mockResolvedValue(mockProducts);

    const req = {
      body: {
        checked: [],
        radio: [],
      },
    };

    const res = mockRes();

    await productFiltersController(req, res);

    expect(productModel.find).toHaveBeenCalledWith({});
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith({
      success: true,
      products: mockProducts,
    });
  });

  it("should throw an error if an error is thrown", async () => {
    productModel.find = jest.fn().mockImplementation(() => {
      throw new Error("Database error");
    });

    const req = {
      body: {
        checked: ["cat1"],
        radio: [10, 100],
      },
    };

    const res = mockRes();

    await productFiltersController(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledWith({
      success: false,
      message: "Error in filtering products",
      error: "Database error",
    });
  });
});

describe("productCountController", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return product count successfully", async () => {
    const mockCount = 42;

    productModel.find = jest.fn().mockReturnValue({
      estimatedDocumentCount: jest.fn().mockResolvedValue(mockCount),
    });

    const req = {};
    const res = mockRes();

    await productCountController(req, res);

    expect(productModel.find).toHaveBeenCalledWith({});
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith({
      success: true,
      total: mockCount,
    });
  });

  it("should throw an error if an error is thrown", async () => {
    productModel.find = jest.fn().mockImplementation(() => {
      throw new Error("Database error");
    });

    const req = {};
    const res = mockRes();

    await productCountController(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledWith({
      success: false,
      message: "Error in counting products",
      error: "Database error",
    });
  });
});

describe("productListController", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return products for page 1 by default", async () => {
    const mockProducts = [
      { _id: "1", name: "Product 1" },
      { _id: "2", name: "Product 2" },
    ];

    const mockQuery = {
      select: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      sort: jest.fn().mockResolvedValue(mockProducts),
    };

    productModel.find = jest.fn().mockReturnValue(mockQuery);

    const req = { params: {} };
    const res = mockRes();

    await productListController(req, res);

    expect(productModel.find).toHaveBeenCalledWith({});
    expect(mockQuery.select).toHaveBeenCalledWith("-photo");
    expect(mockQuery.skip).toHaveBeenCalledWith(0);
    expect(mockQuery.limit).toHaveBeenCalledWith(6);
    expect(mockQuery.sort).toHaveBeenCalledWith({ createdAt: -1 });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith({
      success: true,
      products: mockProducts,
    });
  });

  it("should return products for specified page", async () => {
    const mockProducts = [
      { _id: "7", name: "Product 7" },
      { _id: "8", name: "Product 8" },
    ];

    const mockQuery = {
      select: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      sort: jest.fn().mockResolvedValue(mockProducts),
    };

    productModel.find = jest.fn().mockReturnValue(mockQuery);

    const req = { params: { page: 3 } };
    const res = mockRes();

    await productListController(req, res);

    expect(productModel.find).toHaveBeenCalledWith({});
    expect(mockQuery.select).toHaveBeenCalledWith("-photo");
    expect(mockQuery.skip).toHaveBeenCalledWith(12); // (3-1) * 6 = 12
    expect(mockQuery.limit).toHaveBeenCalledWith(6);
    expect(mockQuery.sort).toHaveBeenCalledWith({ createdAt: -1 });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith({
      success: true,
      products: mockProducts,
    });
  });

  it("should throw an error if an error is thrown", async () => {
    productModel.find = jest.fn().mockImplementation(() => {
      throw new Error("Database error");
    });

    const req = { params: { page: 1 } };
    const res = mockRes();

    await productListController(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledWith({
      success: false,
      message: "Error in listing products per page",
      error: "Database error",
    });
  });
});

describe("searchProductController", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should search products by keyword successfully", async () => {
    const mockProducts = [
      { _id: "1", name: "Test Product", description: "A test product" },
      {
        _id: "2",
        name: "Another Product",
        description: "Contains test keyword",
      },
    ];

    const mockQuery = {
      select: jest.fn().mockResolvedValue(mockProducts),
    };

    productModel.find = jest.fn().mockReturnValue(mockQuery);

    const req = { params: { keyword: "test" } };
    const res = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
    };

    await searchProductController(req, res);

    expect(productModel.find).toHaveBeenCalledWith({
      $or: [
        { name: { $regex: "test", $options: "i" } },
        { description: { $regex: "test", $options: "i" } },
      ],
    });
    expect(mockQuery.select).toHaveBeenCalledWith("-photo");
    expect(res.json).toHaveBeenCalledWith(mockProducts);
  });

  it("should return empty array when no products match", async () => {
    const mockProducts = [];

    const mockQuery = {
      select: jest.fn().mockResolvedValue(mockProducts),
    };

    productModel.find = jest.fn().mockReturnValue(mockQuery);

    const req = { params: { keyword: "nonexistent" } };
    const res = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
    };

    await searchProductController(req, res);

    expect(productModel.find).toHaveBeenCalledWith({
      $or: [
        { name: { $regex: "nonexistent", $options: "i" } },
        { description: { $regex: "nonexistent", $options: "i" } },
      ],
    });
    expect(mockQuery.select).toHaveBeenCalledWith("-photo");
    expect(res.json).toHaveBeenCalledWith(mockProducts);
  });

  it("should throw an error if an error is thrown", async () => {
    productModel.find = jest.fn().mockImplementation(() => {
      throw new Error("Database error");
    });

    const req = { params: { keyword: "test" } };
    const res = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
    };

    await searchProductController(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledWith({
      success: false,
      message: "Error in searching product",
      error: "Database error",
    });
  });
});

describe("realtedProductController", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return related products successfully", async () => {
    const mockProducts = [
      { _id: "2", name: "Related Product 1", category: "cat1" },
      { _id: "3", name: "Related Product 2", category: "cat1" },
      { _id: "4", name: "Related Product 3", category: "cat1" },
    ];

    const mockQuery = {
      select: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      populate: jest.fn().mockResolvedValue(mockProducts),
    };

    productModel.find = jest.fn().mockReturnValue(mockQuery);

    const req = { params: { pid: "1", cid: "cat1" } };
    const res = mockRes();

    await realtedProductController(req, res);

    expect(productModel.find).toHaveBeenCalledWith({
      category: "cat1",
      _id: { $ne: "1" },
    });
    expect(mockQuery.select).toHaveBeenCalledWith("-photo");
    expect(mockQuery.limit).toHaveBeenCalledWith(3);
    expect(mockQuery.populate).toHaveBeenCalledWith("category");
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith({
      success: true,
      products: mockProducts,
    });
  });

  it("should return empty array when no related products found", async () => {
    const mockProducts = [];

    const mockQuery = {
      select: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      populate: jest.fn().mockResolvedValue(mockProducts),
    };

    productModel.find = jest.fn().mockReturnValue(mockQuery);

    const req = { params: { pid: "1", cid: "cat1" } };
    const res = mockRes();

    await realtedProductController(req, res);

    expect(productModel.find).toHaveBeenCalledWith({
      category: "cat1",
      _id: { $ne: "1" },
    });
    expect(mockQuery.select).toHaveBeenCalledWith("-photo");
    expect(mockQuery.limit).toHaveBeenCalledWith(3);
    expect(mockQuery.populate).toHaveBeenCalledWith("category");
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith({
      success: true,
      products: mockProducts,
    });
  });

  it("should throw an error if an error is thrown", async () => {
    productModel.find = jest.fn().mockImplementation(() => {
      throw new Error("Database error");
    });

    const req = { params: { pid: "1", cid: "cat1" } };
    const res = mockRes();

    await realtedProductController(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledWith({
      success: false,
      message: "Error in geting related product",
      error: "Database error",
    });
  });
});

describe("productCategoryController", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return products by category successfully", async () => {
    const mockCategory = {
      _id: "cat1",
      name: "Electronics",
      slug: "electronics",
    };

    const mockProducts = [
      { _id: "1", name: "Product 1", category: "cat1" },
      { _id: "2", name: "Product 2", category: "cat1" },
    ];

    categoryModel.findOne = jest.fn().mockResolvedValue(mockCategory);

    const mockQuery = {
      populate: jest.fn().mockResolvedValue(mockProducts),
    };

    productModel.find = jest.fn().mockReturnValue(mockQuery);

    const req = { params: { slug: "electronics" } };
    const res = mockRes();

    await productCategoryController(req, res);

    expect(categoryModel.findOne).toHaveBeenCalledWith({
      slug: "electronics",
    });
    expect(productModel.find).toHaveBeenCalledWith({ category: mockCategory });
    expect(mockQuery.populate).toHaveBeenCalledWith("category");
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith({
      success: true,
      category: mockCategory,
      products: mockProducts,
    });
  });

  it("should handle category not found", async () => {
    categoryModel.findOne = jest.fn().mockResolvedValue(null);

    const mockQuery = {
      populate: jest.fn().mockResolvedValue([]),
    };

    productModel.find = jest.fn().mockReturnValue(mockQuery);

    const req = { params: { slug: "nonexistent" } };
    const res = mockRes();

    await productCategoryController(req, res);

    expect(categoryModel.findOne).toHaveBeenCalledWith({
      slug: "nonexistent",
    });
    expect(productModel.find).toHaveBeenCalledWith({ category: null });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith({
      success: true,
      category: null,
      products: [],
    });
  });

  it("should throw an error if an error is thrown", async () => {
    categoryModel.findOne = jest.fn().mockImplementation(() => {
      throw new Error("Database error");
    });

    const req = { params: { slug: "electronics" } };
    const res = mockRes();

    await productCategoryController(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledWith({
      success: false,
      message: "Error in getting products by category",
      error: "Database error",
    });
  });
});
