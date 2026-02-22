// Sun Zhiyuan Felix (A0272474Y)

import { renderHook, waitFor } from "@testing-library/react";
import axios from "axios";
import useCategory from "./useCategory";

jest.mock("axios");

describe("useCategory", () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    test("successful category fetch", async () => {
        const mockCategories = [{ name: "Category 1" }, { name: "Category 2" }];
        axios.get.mockResolvedValue({ data: { category: mockCategories } });
    
        const { result } = renderHook(() => useCategory());

        await waitFor(() => expect(result.current).toEqual(mockCategories));

        expect(axios.get).toHaveBeenCalledWith("/api/v1/category/get-category");
        expect(axios.get).toHaveBeenCalledTimes(1);
    });

    test("error during category fetch", async () => {
        jest.spyOn(console, "log").mockImplementation(() => {});

        const mockError = new Error("Network error");
        axios.get.mockRejectedValue(mockError);

        const { result } = renderHook(() => useCategory());

        await waitFor(() => expect(result.current).toEqual([]));

        expect(console.log).toHaveBeenCalledWith(mockError);

        console.log.mockRestore();
    });
});