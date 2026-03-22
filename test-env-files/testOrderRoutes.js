//Varatharaju Mithuna, A0281223N
// test-env-files/testOrderRoutes.js
import express from "express";
import { seedPlaywrightOrders, seedPlaywrightCategories, seedPlaywrightProducts, cleanupPlaywrightData} from "./testServerDataHelper.js";

const router = express.Router();

router.post("/seed-orders", async (req, res) => {
    try {
        await seedPlaywrightOrders();
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Failed to seed orders" });
    }
});

router.post("/seed-categories", async (req, res) => {
    try {
        await seedPlaywrightCategories();
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Failed to seed categories" });
    }
});

router.post("/seed-allProducts", async (req, res) => {
    try {
        await seedPlaywrightProducts();
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Failed to seed products" });
    }
});

router.delete("/cleanup-data", async (req, res) => {
    try {
        const { email } = req.body;
        await cleanupPlaywrightData(email);
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false });
    }
});

export default router;