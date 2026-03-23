import { hashPassword } from "../helpers/authHelper.js";
import userModel from "../models/userModel.js";
import categoryModel from "../models/categoryModel.js";
import productModel from "../models/productModel.js";
import slugify from "slugify";
import { seededAdmin } from "../e2e-tests/isolated-environment-tests/seededAdmin.js";
import { seededProducts } from "../e2e-tests/isolated-environment-tests/seededProducts.js";

async function seedPlaywrightAdmin() {
    const admin = seededAdmin;
    const existingAdmin = await userModel.findOne({ email: admin.email });

    if (existingAdmin) {
        return;
    }

    const hashedPassword = await hashPassword(admin.password);

    await userModel.create({
        name: admin.name,
        email: admin.email,
        password: hashedPassword,
        phone: admin.phone,
        address: admin.address,
        answer: admin.answer,
        role: admin.role,
    });
}

async function seedPlaywrightProducts() {
  for (const product of seededProducts) {
    let category = await categoryModel.findOne({ name: product.categoryName });

    if (!category) {
      category = await categoryModel.create({
        name: product.categoryName,
        slug: slugify(product.categoryName),
      });
    }

    const existingProduct = await productModel.findOne({ slug: product.slug });
    if (existingProduct) {
      continue;
    }

    await productModel.create({
      name: product.name,
      slug: product.slug,
      description: product.description,
      price: product.price,
      quantity: product.quantity,
      shipping: product.shipping,
      category: category._id,
    });
  }
}


function registerTestRoutes(app, { clearTestDataPreservingUsers }) {
    app.post('/api/v1/test/reset', async (req, res) => {
        try {
            await clearTestDataPreservingUsers();
            res.status(200).send({ success: true });
        } catch (error) {
            res.status(500).send({ success: false, message: 'Failed to reset test database' });
        }
    });
    app.post('/api/v1/test/seed-products', async (req, res) => {
        try {
            await seedPlaywrightProducts();
            res.status(200).send({ success: true });
        } catch (error) {
            res.status(500).send({ success: false, message: 'Failed to seed products' });
        }
    });
}

export { registerTestRoutes, seedPlaywrightAdmin, seedPlaywrightProducts };