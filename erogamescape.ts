import { DOMParser, Element } from "deno_dom/deno-dom-wasm.ts";
import { assert } from "std/assert";

function zipObject<V>(keys: string[], values: V[]): Record<string, V> {
  const obj = Object.create(null);
  for (let i = 0; i < keys.length; i++) {
    obj[keys[i]] = values[i];
  }
  return obj;
}

export async function query(sql: string) {
  const endpoint =
    "https://erogamescape.dyndns.org/~ap2/ero/toukei_kaiseki/sql_for_erogamer_form.php";
  const response = await fetch(endpoint, {
    method: "POST",
    body: new URLSearchParams({ sql }),
  });
  const parser = new DOMParser();
  const doc = parser.parseFromString(await response.text(), "text/html");
  assert(doc);
  const columns = [...doc.querySelectorAll("#query_result_main th")].map((e) =>
    e.textContent
  );
  if (!doc.querySelector("#queryplan")) {
    throw new Error(doc.querySelector("#query_result_main")?.textContent);
  }
  return [...doc.querySelectorAll("#query_result_main tr")].flatMap((e) => {
    if (!(e instanceof Element)) {
      return [];
    }
    const elem = e as Element;
    const rowTexts = [...elem.querySelectorAll("td")].map((e) => e.textContent);
    return rowTexts.length === 0 ? [] : [zipObject(columns, rowTexts)];
  });
}

type BrandOptions = {
  since?: string;
  minPlayDataCount?: number;
  minMedian?: number;
  alive?: boolean;
};

export async function fetchBrands(opt: BrandOptions = {}) {
  const whereClauses = [
    "brandlist.kind = 'CORPORATION'",
    "brandlist.url IS NOT NULL",
    "gamelist.erogame",
  ];
  if (opt.since) {
    whereClauses.push(
      `gamelist.sellday BETWEEN '${opt.since}' AND '2029-12-31'`,
    );
  } else {
    whereClauses.push(`gamelist.sellday < '2029-12-31'`);
  }
  if (opt.minPlayDataCount) {
    whereClauses.push(`gamelist.count2 > ${opt.minPlayDataCount}`);
  }
  if (opt.minMedian) {
    whereClauses.push(`gamelist.median > ${opt.minMedian}`);
  }
  if (opt.alive !== undefined) {
    whereClauses.push(opt.alive ? "NOT brandlist.lost" : "brandlist.lost");
  }

  const sql = `
  SELECT
    DISTINCT brandlist.id,
    brandlist.brandname, brandlist.url
    FROM brandlist
    INNER JOIN gamelist ON brandlist.id = gamelist.brandname
    WHERE ${whereClauses.join(" AND ")}
  `.trim();
  const records = await query(sql);
  return records.map((r) => {
    return {
      name: r["brandname"],
      url: r["url"],
    };
  });
}
