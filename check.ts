import { isBrands } from "./types.ts";
import { assert } from "std/assert";

async function loadBrands() {
  const brands = JSON.parse(
    await Deno.readTextFile("./cache/brands_alive.json"),
  ) as unknown;
  if (!isBrands(brands)) {
    throw new Error();
  }
  return brands;
}

async function isCensored(url: string) {
  const timeout = 15000;
  const controller = new AbortController();
  const timer = setTimeout(() => {
    controller.abort();
  }, timeout);
  try {
    const response = await fetch(url, { signal: controller.signal });
    const body = await response.text();
    return body.includes("http://ngfw.cert.u-tokyo.ac.jp/firewall.html");
  } catch (error) {
    if (error instanceof TypeError) {
      return true;
    }
    if (
      error instanceof DOMException && error.code === DOMException.ABORT_ERR
    ) {
      return undefined;
    }
    throw error;
  } finally {
    clearTimeout(timer);
  }
}

assert(
  await isCensored("https://www.alicesoft.com/"),
  "`isCensored` doesn't work",
);
assert(
  await isCensored("http://www.alicesoft.com/"),
  "`isCensored` doesn't work",
);

const brands = await loadBrands();

type CheckResult = {
  name: string;
  url: string;
  censored: boolean | null;
};

const res = [] as CheckResult[];

let progress = 0;
for (const brand of brands) {
  progress++;
  console.log(`${progress} / ${brands.length}: ${brand.name}`);
  res.push({
    ...brand,
    censored: await isCensored(brand.url) ?? null,
  });
}

await Deno.writeTextFile("./cache/brands_result.json", JSON.stringify(res));
