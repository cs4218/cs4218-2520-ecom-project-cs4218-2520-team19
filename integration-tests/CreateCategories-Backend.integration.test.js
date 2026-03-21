// Sun Zhiyuan Felix (A0272474Y)

import axios from "axios";
import userModel from "../models/userModel.js";
import { clearTestDatabase, startTestServer, stopTestServer } from "../testServer.js";

let authToken;

jest.setTimeout(30000);

async function getAuthToken() {
  // Register a test user
  const registerRes = await axios.post(
    "http://localhost:6060/api/v1/auth/register",
    {
      name: "Test Admin",
      email: "test@example.com",
      password: "test123",
      phone: "1234567890",
      address: "Test Address",
      answer: "test"
    }
  ).catch(() => null);

  // Login to get token
  let loginRes;
  try {
    loginRes = await axios.post(
      "http://localhost:6060/api/v1/auth/login",
      {
        email: "test@example.com",
        password: "test123"
      }
    );
  } catch (error) {
    const status = error?.response?.status;
    const message = error?.response?.data?.message || error.message;
    throw new Error(`Login failed (${status}): ${message}`);
  }

  // Upgrade user to admin in database
  await userModel.updateOne(
    { email: "test@example.com" },
    { role: 1 }
  );

  return loginRes.data.token;
}

// Helper to wait for server to be ready
async function waitForServer(url = "http://localhost:6060", maxAttempts = 30, delay = 500) {
  const originalError = console.error;
  console.error = () => {}; // Temporarily suppress errors
  
  try {
    for (let i = 0; i < maxAttempts; i++) {
      try {
        await axios.get(url);
        console.error = originalError; // Re-enable console.error
        return true;
      } catch (error) {
        if (i < maxAttempts - 1) {
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }
    console.error = originalError; // Re-enable console.error
    throw new Error(`Server failed to start at ${url}`);
  } catch (error) {
    console.error = originalError; // Re-enable console.error
    throw error;
  }
}

describe("Categories Component Integration Test", () => {
    beforeAll(async () => {
        await startTestServer();
        await waitForServer();
    });

    afterAll(async () => {
      await stopTestServer();
    });

    beforeEach(async () => {
      await clearTestDatabase();
      authToken = await getAuthToken();
    });
    
    test("Should create a new category", async () => {
      const createRes = await axios.post(
        "http://localhost:6060/api/v1/category/create-category",
        { name: "New Category" },
        { headers: { Authorization: authToken } }
      );
      const getRes = await axios.get(
        "http://localhost:6060/api/v1/category/get-category"
      );
      expect(getRes.data.category).toContainEqual(
        expect.objectContaining({ name: "New Category" })
      );
    });

    test("Should not create category without auth", async () => {
      jest.spyOn(console, "log").mockImplementation(() => {});
      try {
        await axios.post(
          "http://localhost:6060/api/v1/category/create-category",
          { name: "New Category" }
        );
      } catch (error) {
        expect(error.response.status).toBe(401);
        expect(error.response.data).toHaveProperty("success", false);
      } finally {
        console.log.mockRestore();
      }
    });

    test("Should not create category with empty name", async () => {
      try {
        await axios.post(
          "http://localhost:6060/api/v1/category/create-category",
          { name: "" },
          { headers: { Authorization: authToken } }
        );
      } catch (error) {
        expect(error.response.status).toBe(400);
        expect(error.response.data).toHaveProperty("message", "Name is required");
      }
    });

    test("Should not create category with duplicate name", async () => {
      const createRes = await axios.post(
        "http://localhost:6060/api/v1/category/create-category",
        { name: "Duplicate Category" },
        { headers: { Authorization: authToken } }
      );

      try {
        await axios.post(
          "http://localhost:6060/api/v1/category/create-category",
          { name: "Duplicate Category" },
          { headers: { Authorization: authToken } }
        );
      } catch (error) {
        expect(error.response.status).toBe(409);
        expect(error.response.data).toHaveProperty("success", false);
      }
    });

    test("Should update an existing category", async () => {
      const createRes = await axios.post(
        "http://localhost:6060/api/v1/category/create-category",
        { name: "Old Category" },
        { headers: { Authorization: authToken } }
      );

      const categoryId = createRes.data.category._id;

      const updateRes = await axios.put(
        `http://localhost:6060/api/v1/category/update-category/${categoryId}`,
        { name: "Updated Category" },
        { headers: { Authorization: authToken } }
      );

      const getRes = await axios.get(
        "http://localhost:6060/api/v1/category/get-category"
      );
      expect(getRes.data.category).toContainEqual(
        expect.objectContaining({ name: "Updated Category" })
      );
    });

    test("Should not update category without auth", async () => {
      jest.spyOn(console, "log").mockImplementation(() => {});
      const createRes = await axios.post(
        "http://localhost:6060/api/v1/category/create-category",
        { name: "Old Category" },
        { headers: { Authorization: authToken } }
      );
      const categoryId = createRes.data.category._id;

      try {
        await axios.put(
          `http://localhost:6060/api/v1/category/update-category/${categoryId}`,
          { name: "Updated Category" }
        );
      } catch (error) {
        expect(error.response.status).toBe(401);
        expect(error.response.data).toHaveProperty("success", false);
      } finally {
        console.log.mockRestore();
      }
    });

    test("Should not update category with empty name", async () => {
      const createRes = await axios.post(
        "http://localhost:6060/api/v1/category/create-category",
        { name: "Old Category" },
        { headers: { Authorization: authToken } }
      );
      const categoryId = createRes.data.category._id;

      try {
        await axios.put(
          `http://localhost:6060/api/v1/category/update-category/${categoryId}`,
          { name: "" },
          { headers: { Authorization: authToken } }
        );
      } catch (error) {
        expect(error.response.status).toBe(400);
        expect(error.response.data).toHaveProperty("message", "Name is required");
      }
    });

    test("Should not update category to duplicate name", async () => {
      const createRes1 = await axios.post(
        "http://localhost:6060/api/v1/category/create-category",
        { name: "Category One" },
        { headers: { Authorization: authToken } }
      );
      const createRes2 = await axios.post(
        "http://localhost:6060/api/v1/category/create-category",
        { name: "Category Two" },
        { headers: { Authorization: authToken } }
      );
      const categoryId = createRes2.data.category._id;

      try {
        await axios.put(
          `http://localhost:6060/api/v1/category/update-category/${categoryId}`,
          { name: "Category One" },
          { headers: { Authorization: authToken } }
        );
      } catch (error) {
        expect(error.response.status).toBe(409);
        expect(error.response.data).toHaveProperty("success", false);
      }
    });

    test ("Should delete an existing category", async () => {
      const createRes = await axios.post(
        "http://localhost:6060/api/v1/category/create-category",
        { name: "Delete Category" },
        { headers: { Authorization: authToken } }
      );
      const categoryId = createRes.data.category._id; 

      const deleteRes = await axios.delete(
        `http://localhost:6060/api/v1/category/delete-category/${categoryId}`,
        { headers: { Authorization: authToken } }
      );

      const getRes = await axios.get(
        "http://localhost:6060/api/v1/category/get-category"
      );
      expect(getRes.data.category).not.toContainEqual(
        expect.objectContaining({ name: "Delete Category" })
       );
    });

    test("Should not delete category without auth", async () => {
      jest.spyOn(console, "log").mockImplementation(() => {});
      const createRes = await axios.post(
        "http://localhost:6060/api/v1/category/create-category",
        { name: "Delete Category" },
        { headers: { Authorization: authToken } }
      );
      const categoryId = createRes.data.category._id;
      try {
        await axios.delete(
          `http://localhost:6060/api/v1/category/delete-category/${categoryId}`
        );
      } catch (error) {
        expect(error.response.status).toBe(401);
        expect(error.response.data).toHaveProperty("success", false);
      } finally {
        console.log.mockRestore();
      }
    });

    test("Should not delete non-existent category", async () => {
      jest.spyOn(console, "log").mockImplementation(() => {});
      try {
        await axios.delete(
          `http://localhost:6060/api/v1/category/delete-category/123`,
          { headers: { Authorization: authToken } }
         );
      } catch (error) {
        expect(error.response.status).toBe(500);
        expect(error.response.data).toHaveProperty("success", false);
      } finally {
        console.log.mockRestore();
      }
    });
  });
