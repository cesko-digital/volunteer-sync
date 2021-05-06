import { chunk } from "./utils";

test("Split array into chunks", () => {
  expect(chunk([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]]);
  expect(chunk([1], 2)).toEqual([[1]]);
  expect(chunk([], 2)).toEqual([]);
});
