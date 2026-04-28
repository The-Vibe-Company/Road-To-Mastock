/**
 * Dump the ANIMALS array to a JSON file consumable by the Python image
 * generator. Run via: npx tsx scripts/dump-animals-json.ts
 */
import { writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { ANIMALS } from "../src/lib/animals/data";

const OUT = join(process.cwd(), "data", "animals.json");
mkdirSync(join(process.cwd(), "data"), { recursive: true });
writeFileSync(OUT, JSON.stringify(ANIMALS, null, 2));
console.log(`Wrote ${ANIMALS.length} animals to ${OUT}`);
