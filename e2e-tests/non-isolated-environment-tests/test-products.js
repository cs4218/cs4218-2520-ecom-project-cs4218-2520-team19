import slugify from "slugify";
import categoryModel from "../../models/categoryModel.js";
import productModel from "../../models/productModel.js";

const productsData = [
    {
        name: "Textbook",
        description: "A comprehensive textbook",
        price: 79.99,
        categoryName: "Books",
        quantity: 50,
        shipping: false,
    },
    {
        name: "Laptop",
        description: "A powerful laptop",
        price: 1499.99,
        categoryName: "Electronics",
        quantity: 25,
        shipping: true,
    },
    {
        name: "Smartphone",
        description: "A high-end smartphone",
        price: 999.99,
        categoryName: "Electronics",
        quantity: 50,
        shipping: false,
    },
    {
        name: "Novel",
        description: "A bestselling novel",
        price: 14.99,
        categoryName: "Books",
        quantity: 100,
        shipping: true,
    },
    {
        name: "NUS T-shirt",
        description: "Plain NUS T-shirt for sale",
        price: 4.99,
        categoryName: "Clothing",
        quantity: 200,
        shipping: true,
    },
];

async function createTestData() {
    for (const p of productsData) {
      let category = await categoryModel.findOne({ name: p.categoryName });
      if (!category) {
        category = await categoryModel.create({
          name: p.categoryName,
          slug: slugify(p.categoryName, { lower: true }),
        });
      }

      if (!await productModel.findOne({ name: p.name })) {
        await productModel.create({
          name: p.name,
          slug: slugify(p.name, { lower: true }),
          description: p.description,
          price: p.price,
          category: category._id,
          quantity: p.quantity,
          shipping: p.shipping,
        });
      }
    }
}

async function deleteTestData() {
  for (const p of productsData) {
    await categoryModel.deleteMany({ name: p.categoryName });
    await productModel.deleteMany({ name: p.name });
  }
};

export { createTestData, deleteTestData };