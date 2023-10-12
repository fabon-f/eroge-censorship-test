import { fetchBrands } from "./erogamescape.ts";

console.log(
  await fetchBrands({
    minPlayDataCount: 20,
    minMedian: 60,
    since: "2010-10-01",
  }),
);
