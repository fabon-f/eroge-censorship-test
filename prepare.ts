import { Brands, isBrands } from "./types.ts";
import { fetchBrands } from "./erogamescape.ts";

async function isAlive(url: string): Promise<false | string> {
  if (new URL(url).host.endsWith("archive.org")) {
    return false;
  }
  const timeout = 15000;
  const controller = new AbortController();
  const timer = setTimeout(() => {
    controller.abort();
  }, timeout);
  let response: Response;
  try {
    response = await fetch(url, { signal: controller.signal });
  } catch (_e) {
    return false;
  } finally {
    clearTimeout(timer);
  }

  if (new URL(url).host.endsWith("dmm.co.jp")) {
    // skip age check page
    return url;
  }

  return response.url;
}

async function getBrands(): Promise<Brands> {
  const file = "./cache/brands_all.json";
  try {
    const brands = JSON.parse(await Deno.readTextFile(file)) as unknown;
    if (!isBrands(brands)) {
      throw new Error(`Invalid JSON: ${file}`);
    }
    return brands;
  } catch (e) {
    if (e.code !== "ENOENT") {
      throw e;
    }
    const brands = await fetchBrands({
      minPlayDataCount: 20,
      minMedian: 60,
      since: "2010-01-01",
    });
    await Deno.writeTextFile(file, JSON.stringify(brands));
    return brands;
  }
}

const brands = await getBrands();

const aliveHpBrands = [] as typeof brands;

let progress = 0;
for (const brand of brands) {
  progress++;
  console.log(`${progress} / ${brands.length}: ${brand.name}`);
  const res = await isAlive(brand.url);
  if (res) {
    // res: URL after redirects
    aliveHpBrands.push({
      name: brand.name,
      url: res,
    });
  }
}

await Deno.writeTextFile(
  "./cache/brands_alive.json",
  JSON.stringify(aliveHpBrands),
);
