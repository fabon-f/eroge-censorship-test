import { assertEquals } from "std/assert";
import { query } from "./erogamescape.ts";

Deno.test(async function queryTest() {
  assertEquals(await query("SELECT id from gamelist WHERE id = 27059"), [{
    id: "27059",
  }]);
});
