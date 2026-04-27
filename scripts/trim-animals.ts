import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const FILE = join(process.cwd(), "src/lib/animals/data.ts");
const TO_REMOVE = new Set([
  // Uncommon trims (48)
  "european-roller-juv",
  "european-roller-immature",
  "common-pheasant-female",
  "european-eagle-owl-juv",
  "raccoon-young",
  "fennec-fox-juv",
  "wolverine-young",
  "okapi-female",
  "common-iguana-juv",
  "common-eland-juv",
  "cape-buffalo-young",
  "tapir-malayan-juv",
  "leopard-seal-juv",
  "stellers-sea-lion-young",
  "atlantic-salmon-spawning",
  "european-cuttlefish-large",
  "european-squid-broad",
  "lemon-shark-juv",
  "black-and-white-lemur",
  "bushbaby-galago",
  "slow-loris",
  "tarsier-philippine",
  "cotton-top-tamarin",
  "golden-lion-tamarin",
  "patas-monkey",
  "colobus-mantled",
  "langur-hanuman",
  "white-handed-gibbon",
  "moluccan-cockatoo",
  "alexandrine-parakeet",
  "jacksons-chameleon",
  "panther-chameleon",
  "russian-tortoise",
  "alligator-snapping-turtle",
  "rosy-boa",
  "rainbow-boa",
  "common-brushtail-possum",
  "wallaby-bennett",
  "kit-fox",
  "swift-fox",
  "corsac-fox",
  "luna-moth",
  "hummingbird-hawkmoth",
  "spectacled-owl",
  "demoiselle-crane",
  "great-bustard",
  "asian-glossy-starling", // border uncommon (was placed in commons but trim it)
  "rissos-dolphin",
  // Rare trims (32)
  "italian-wolf",
  "canada-lynx",
  "asian-black-bear",
  "spectacled-bear",
  "margay",
  "amur-leopard",
  "iberian-lynx-juv",
  "saiga-male",
  "scalloped-hammerhead",
  "wobbegong-tasselled",
  "zebra-shark",
  "nurse-shark",
  "sei-whale",
  "right-whale-north-atlantic",
  "pilot-whale-long-finned",
  "false-killer-whale",
  "anaconda-yellow",
  "indian-python",
  "coastal-taipan",
  "saw-scaled-viper",
  "puff-adder",
  "green-mamba",
  "reticulated-python-young",
  "saltwater-crocodile-young",
  "nile-crocodile-young",
  "imperial-eagle",
  "spanish-imperial-eagle",
  "wedge-tailed-eagle",
  "verreaux-eagle",
  "andean-mountain-cat",
  "kodkod",
  "geoffroy-cat",
  "snow-sheep",
]);

const src = readFileSync(FILE, "utf-8");
const lines = src.split("\n");

const out: string[] = [];
let removed = 0;
for (const line of lines) {
  const m = line.match(/slug:\s*"([^"]+)"/);
  if (m && TO_REMOVE.has(m[1])) {
    removed++;
    continue;
  }
  out.push(line);
}

writeFileSync(FILE, out.join("\n"));
console.log(`Removed ${removed} entries.`);
