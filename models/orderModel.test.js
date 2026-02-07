import Order from "./orderModel.js";

describe("Order Model Test Suite", () => {
    test("it should have a products field", () => {
        const order = new Order();
        expect(order.schema.paths).toHaveProperty("products");
    });

    test("it should have a payment field", () => {
        const order = new Order();
        expect(order.schema.paths).toHaveProperty("payment");
    });

    test("it should have a buyer field", () => {
        const order = new Order();
        expect(order.schema.paths).toHaveProperty("buyer");
    });

    test("it should have a status field with default value 'Not Process'", () => {
        const order = new Order();
        expect(order.schema.paths).toHaveProperty("status");
        expect(order.schema.paths.status.options.default).toBe("Not Process");
    });

    test("it should only allow valid status values", async () => {
        const validStatuses = ["Not Processed", "Processing", "Shipped", "Delivered", "Cancelled"];
        for (const status of validStatuses) {
            const validOrder = new Order({ status });
            await expect(validOrder.validate()).resolves.toBeUndefined();
        }
    });

    test("throws error for invalid status value", () => {
        const invalidOrder = new Order({ status: "InvalidStatus" });
        const validationError = invalidOrder.validateSync();
        expect(validationError.errors['status']).toBeDefined();
    });

    test("buyer field should reference 'users' collection", () => {
        const order = new Order();
        expect(order.schema.paths.buyer.options.ref).toBe("users");
    });

    test("products field should reference 'Products' collection", () => {
        const order = new Order();
        expect(order.schema.paths.products.caster.options.ref).toBe("Products");
    });
});