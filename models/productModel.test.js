// Thanakorn Pawirunsiri, A0266315E

import Product from "./productModel.js";

describe("Product Model Test Suite", () => {
  it("should have a name field", () => {
    const product = new Product();
    expect(product.schema.paths).toHaveProperty("name");
  });

  it("should have a slug field", () => {
    const product = new Product();
    expect(product.schema.paths).toHaveProperty("slug");
  });

  it("should have a description field", () => {
    const product = new Product();
    expect(product.schema.paths).toHaveProperty("description");
  });

  it("should have a price field", () => {
    const product = new Product();
    expect(product.schema.paths).toHaveProperty("price");
  });

  it("should have a category field", () => {
    const product = new Product();
    expect(product.schema.paths).toHaveProperty("category");
  });

  it("should have a quantity field", () => {
    const product = new Product();
    expect(product.schema.paths).toHaveProperty("quantity");
  });

  it("should have a photo field with data and contentType", () => {
    const product = new Product();
    expect(product.schema.paths["photo.data"]).toBeDefined();
    expect(product.schema.paths["photo.contentType"]).toBeDefined();
  });

  it("photo.data should be of type Buffer", () => {
    const product = new Product();
    expect(product.schema.paths["photo.data"].instance).toBe("Buffer");
  });

  it("photo.contentType should be of type String", () => {
    const product = new Product();
    expect(product.schema.paths["photo.contentType"].instance).toBe("String");
  });

  it("should have a shipping field", () => {
    const product = new Product();
    expect(product.schema.paths).toHaveProperty("shipping");
  });

  it("name, slug, description, price, category and quantity should be required", () => {
    const product = new Product({});
    const validationError = product.validateSync();

    expect(validationError.errors["name"]).toBeDefined();
    expect(validationError.errors["slug"]).toBeDefined();
    expect(validationError.errors["description"]).toBeDefined();
    expect(validationError.errors["price"]).toBeDefined();
    expect(validationError.errors["category"]).toBeDefined();
    expect(validationError.errors["quantity"]).toBeDefined();
  });

  it("category field should reference 'Category' collection", () => {
    const product = new Product();
    expect(product.schema.paths.category.options.ref).toBe("Category");
  });

  it("price and quantity should be of type Number", () => {
    const product = new Product();
    expect(product.schema.paths.price.instance).toBe("Number");
    expect(product.schema.paths.quantity.instance).toBe("Number");
  });

  it("shipping should be of type Boolean", () => {
    const product = new Product();
    expect(product.schema.paths.shipping.instance).toBe("Boolean");
  });

  it("timestamps should be enabled", () => {
    const product = new Product();
    expect(product.schema.options.timestamps).toBe(true);
  });

  it("valid product should pass validation", async () => {
    const mongoose = (await import("mongoose")).default;

    const validProduct = new Product({
      name: "Test Product",
      slug: "test-product",
      description: "This is a test product",
      price: 100,
      category: new mongoose.Types.ObjectId(),
      quantity: 10,
    });

    await expect(validProduct.validate()).resolves.toBeUndefined();
  });
});
