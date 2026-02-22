// Sun Zhiyuan Felix (A0272474Y)

import categoryModel from "./categoryModel";

describe("categoryModel", () => {

    it("should have a name field", async () => {
        const category = new categoryModel();

        expect(category.schema.paths).toHaveProperty("name");
    });

    it("should have a slug field", async () => {
        const category = new categoryModel();

        expect(category.schema.paths).toHaveProperty("slug");
    });

    it("should require a name", async () => {
        const category = new categoryModel();

        try {
            await category.validate();
        } catch (error) {
            expect(error.errors).toBeDefined();
            expect(error.errors.name.message).toContain("Path `name` is required");
        }
    });

    it("should require a non-empty name", async () => {
        const category = new categoryModel({ name: "" });

        try {
            await category.validate();
        } catch (error) {
            expect(error.errors).toBeDefined();
            expect(error.errors.name.message).toContain("Path `name` is required");
        }
    });

    it("should require a unique name", async () => {
        const category = new categoryModel();

        expect(category.schema.paths.name.options.unique).toBe(true);
    });
});