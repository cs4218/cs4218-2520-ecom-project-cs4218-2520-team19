/* istanbul ignore file */
// Varatharaju Mithuna, A0281223N
// test-env-files/testServerDataHelper.js
import userModel from "../models/userModel.js";
import categoryModel from "../models/categoryModel.js";
import productModel from "../models/productModel.js";
import orderModel from "../models/orderModel.js";

const TEST_TAG = "PW_TEST";

// Seed categories (can be reused)
async function seedPlaywrightCategories() {
    const categoriesData = [
        { name: "Electronics", slug: "electronics" },
        { name: "Books", slug: "books" },
        { name: "Clothing", slug: "clothing" },
        { name: "Home", slug: "home" },
    ];

    const categories = [];
    for (const c of categoriesData) {
        let category = await categoryModel.findOne({ name: c.name });
        if (!category) {
            category = await categoryModel.create(c);
        }
        categories.push(category);
    }
    return categories;
}

// Seed products (attach to categories)
async function seedPlaywrightProducts() {
    const categories = await seedPlaywrightCategories();

    const productsData = [
        { name: `Smartphone ${TEST_TAG}`, description: "Latest smartphone", price: 300, categoryName: "Electronics", quantity: 10, shipping: true },
        { name: `Laptop ${TEST_TAG}`, description: "Gaming laptop", price: 1000, categoryName: "Electronics", quantity: 5, shipping: true },
        { name: `Book ${TEST_TAG}`, description: "Fiction book", price: 20, categoryName: "Books", quantity: 50, shipping: false },
        { name: `T-Shirt ${TEST_TAG}`, description: "Cool t-shirt", price: 25, categoryName: "Clothing", quantity: 30, shipping: false },
        { name: `Blender ${TEST_TAG}`, description: "Kitchen blender", price: 60, categoryName: "Home", quantity: 15, shipping: true },
    ];

    const products = [];
    for (const p of productsData) {
        const category = categories.find(c => c.name === p.categoryName);
        const product = await productModel.create({
            name: p.name,
            slug: p.name.toLowerCase().replace(/\s+/g, "-"),
            description: p.description,
            price: p.price,
            category: category._id,
            quantity: p.quantity,
            shipping: p.shipping,
        });
        products.push(product);
    }
    return products;
}

// Original order seeding function
async function seedPlaywrightOrders(userEmail = "uitestorder@email.com") {
    const user = await userModel.findOne({ email: userEmail });
    if (!user) throw new Error("Test user not found");

    const products = await seedPlaywrightProducts();

    // Seed a sample order
    await orderModel.create({
        products: products.map(p => p._id),
        payment: { success: true },
        buyer: user._id,
        status: "Delivered"
    });
}

// Cleanup helper
async function cleanupPlaywrightData(userEmail = "uitestorder@email.com") {
    const user = await userModel.findOne({ email: userEmail });
    if (user) {
        await orderModel.deleteMany({ buyer: user._id });
    }
    await productModel.deleteMany({ name: { $regex: TEST_TAG } });
    await categoryModel.deleteMany({ name: { $in: ["Electronics", "Books", "Clothing", "Home"] } });
}

export { seedPlaywrightCategories, seedPlaywrightProducts, seedPlaywrightOrders, cleanupPlaywrightData };
