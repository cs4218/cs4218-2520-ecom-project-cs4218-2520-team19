// Sun Zhiyuan Felix (A0272474Y)

import http from "k6/http";
import { check, group, sleep } from "k6";

const BASE_URL = "http://localhost:6060";
const CURRENT_USERS = 100;
const SPIKE_USERS = 3000;
const P90_MS = 4000;
const FAILURE_RATE = 0.05;
const ISOLATED_ENV = true;

const TRAFFIC_SPLIT = {
  home: 0.2,
  product: 0.4,
  category: 0.4
};

function parseJson(res) {
  try {
    return res.json();
  } catch (error) {
    return null;
  }
}

export function setup() {
  if (ISOLATED_ENV) {
    const seedRes = http.post(
      `${BASE_URL}/api/v1/test/seed-products`,
      null,
      { tags: { flow: "setup", api: "seed-products" } }
    );
    check(seedRes, {
      "seed products endpoint available": (res) => res.status === 200,
    });
  }

  // Sample product ID for endpoints requiring data. 
  const productsRes = http.get(`${BASE_URL}/api/v1/product/get-product`, {
    tags: { flow: "setup", api: "get-product" },
  });
  const productsBody = parseJson(productsRes);
  const sampleProduct = productsBody?.products?.[0] || null;
  // Sample category ID for endpoints requiring data.
  const categoriesRes = http.get(`${BASE_URL}/api/v1/category/get-category`, {
    tags: { flow: "setup", api: "get-category" },
  });
  const categoriesBody = parseJson(categoriesRes);
  const sampleCategory = categoriesBody?.categories?.[0] || null;

  const productId = sampleProduct?._id || null;
  const productSlug = sampleProduct?.slug || null;
  const categoryId = sampleProduct?.category?._id || null; 
  const categorySlug = sampleCategory?.slug || null;

  check(productsRes, {
    "products endpoint returns data": (res) => res.status === 200,
  });

  return { productId, productSlug, categoryId, categorySlug };
}

export const options = {
  stages: [
    // Baseline
    { duration: "1s", target: CURRENT_USERS },
    { duration: "1m", target: CURRENT_USERS },
    // Spike Ramp and Recovery
    { duration: "1m", target: SPIKE_USERS },
    { duration: "5m", target: SPIKE_USERS },
    { duration: "1m", target: CURRENT_USERS },
    // Baseline
    { duration: "1m", target: CURRENT_USERS },
  ],
  thresholds: {
    http_req_failed: [`rate<${FAILURE_RATE}`],
    http_req_duration: [`p(90)<${P90_MS}`],
  },
};

export default function spikeTest(data) {
  const productId = data?.productId;
  const productSlug = data?.productSlug;
  const categoryId = data?.categoryId;
  const categorySlug = data?.categorySlug;
  let randomNumber = Math.random();

  if (randomNumber < TRAFFIC_SPLIT.home) {
    group("get home page", () => {
      const requests = [
        ["GET", `${BASE_URL}/`, null, { tags: { flow: "home", api: "root" } }],
        ["GET", `${BASE_URL}/api/v1/product/get-product`, null, { tags: { flow: "home", api: "get-product" } }],
        ["GET", `${BASE_URL}/api/v1/category/get-category`, null, { tags: { flow: "home", api: "get-category" } }],
        ["GET", `${BASE_URL}/api/v1/product/product-list/1`, null, { tags: { flow: "home", api: "product-list" } }],
      ];

      if (productId) {
        requests.push([
          "GET", 
          `${BASE_URL}/api/v1/product/product-photo/${productId}`,
          null,
          {
            responseCallback: http.expectedStatuses(200, 404),
            tags: { flow: "home", api: "product-photo" },
          }  // Accounting for seeded products which have no photos
        ]);
      }

      const responses = http.batch(requests);

      check(responses[0], { "root returns 200": (res) => res.status === 200 });
      check(responses[1], { "products returns 200": (res) => res.status === 200 });
      check(responses[2], { "categories returns 200": (res) => res.status === 200 });
      check(responses[3], { "product list returns 200": (res) => res.status === 200 });
      if (productId && responses[4]) {
        check(responses[4], {
          "product photo returns 200 or 404": (res) => res.status === 200 || res.status === 404,
        });
      }
    });

  } else if (randomNumber < TRAFFIC_SPLIT.home + TRAFFIC_SPLIT.product) {

    group("get product page", () => {
      const requests = [];

      if (productId) {
        requests.push([
          "GET", 
          `${BASE_URL}/api/v1/product/product-photo/${productId}`,
          null,
          {
            responseCallback: http.expectedStatuses(200, 404),
            tags: { flow: "product", api: "product-photo" },
          }
        ]);
      }
      if (productSlug) {
        requests.push([
          "GET", 
          `${BASE_URL}/api/v1/product/get-product/${productSlug}`,
          null,
          { tags: { flow: "product", api: "get-product-by-slug" } }
        ]);
      }
      if (productId && categoryId) {
        requests.push([
          "GET", 
          `${BASE_URL}/api/v1/product/related-product/${productId}/${categoryId}`,
          null,
          { tags: { flow: "product", api: "related-product" } }
        ]);
      }

      const responses = http.batch(requests);

      if (productId && responses[0]) {
        check(responses[0], {
          "product photo returns 200 or 404": (res) => res.status === 200 || res.status === 404,
        });
      }
      if (productSlug) {
        check(responses[1], { "related product returns 200": (res) => res.status === 200 });
      }
      if (productId && categoryId) {
        check(responses[2], { "related product returns 200": (res) => res.status === 200 });
      }
    });

  } else {

    group("get categories page", () => {
      const requests = [
        ["GET", `${BASE_URL}/api/v1/category/get-category`, null, { tags: { flow: "category", api: "get-category" } }],
      ];

      if (productId) {
        requests.push([
          "GET", 
          `${BASE_URL}/api/v1/product/product-photo/${productId}`,
          null,
          {
            responseCallback: http.expectedStatuses(200, 404),
            tags: { flow: "category", api: "product-photo" },
          }
        ]);
      }
      if (categorySlug) {
        requests.push([
          "GET", 
          `${BASE_URL}/api/v1/category/get-category/${categorySlug}`,
          null,
          { tags: { flow: "category", api: "get-category-by-slug" } }
        ]);
      }

      const responses = http.batch(requests);

      check(responses[0], { "category returns 200": (res) => res.status === 200 });
      if (productId && responses[0]) {
        check(responses[1], {
          "product photo returns 200 or 404": (res) => res.status === 200 || res.status === 404,
        });
      }
      if (categorySlug) {
        check(responses[2], { "category returns 200": (res) => res.status === 200 });
      }
    });
  }

  sleep(1);
}
