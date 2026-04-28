/**
 * Fetches all Pokémon from PokeAPI, gets French names + types + artwork URL,
 * classifies by rarity, writes data/pokemon.json.
 *
 * Run: npx tsx scripts/fetch-pokemon.ts
 */
import { writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const API = "https://pokeapi.co/api/v2";
const TOTAL = 1025; // Pokémon up to gen 9 + DLC

// Hand-picked rarity buckets (slugs use English ID — name will be French)
const MYTHIC_IDS = [
  151, 251, 385, 386, 490, 491, 492, 493, 494, 647, 648, 649, 719, 720, 721,
];
// Mew, Celebi, Jirachi, Deoxys, Manaphy, Darkrai, Shaymin, Arceus,
// Victini, Keldeo, Meloetta, Genesect, Diancie, Hoopa, Volcanion

const LEGENDARY_IDS = [
  150, // Mewtwo
  144, 145, 146, // Articuno, Zapdos, Moltres
  243, 244, 245, // Raikou, Entei, Suicune
  249, 250, // Lugia, Ho-Oh
  380, 381, // Latias, Latios
  377, 378, 379, 486, // Regirock, Regice, Registeel, Regigigas
  382, 383, 384, // Kyogre, Groudon, Rayquaza
  483, 484, 487, // Dialga, Palkia, Giratina
  485, 488, // Heatran, Cresselia
  643, 644, 646, // Reshiram, Zekrom, Kyurem
  716, 717, 718, // Xerneas, Yveltal, Zygarde
  791, 792, 800, // Solgaleo, Lunala, Necrozma
  888, 889, 890, // Zacian, Zamazenta, Eternatus
];

const EPIC_IDS = [
  // Pseudo-legendaries (final forms only)
  149, // Dracolosse
  248, // Tyranocif
  373, // Drattak
  376, // Métalosse
  445, // Carchacrok
  635, // Trioxhydre
  706, // Muplodocus
  784, // Ékaïser
  887, // Lanssorien
  998, // Glaivodo
  // Starter finals (gen 1-9)
  3, 6, 9,        // Florizarre, Dracaufeu, Tortank
  154, 157, 160,  // Méganium, Typhlosion, Aligatueur
  254, 257, 260,  // Jungko, Braségali, Laggron
  389, 392, 395,  // Torterra, Simiabraz, Pingoléon
  497, 500, 503,  // Majaspic, Roitiflam, Clamiral
  652, 655, 658,  // Blindépique, Goupelin, Amphinobi
  724, 727, 730,  // Archéduc, Félinferno, Oratoria
  815, 818, 812,  // Pyrobut, Lézargus, Gorythmic
  908, 911, 914,  // Miascarade, Flamigator, Palmaval
  // Iconic
  94,   // Ectoplasma (Gengar)
  65,   // Alakazam
  143,  // Ronflex
  131,  // Lokhlass
  142,  // Ptéra
  130,  // Léviator (Gyarados)
  448,  // Lucario
  681,  // Exagide (Aegislash)
  778,  // Mimiqui
  700,  // Nymphali (Sylveon)
  745,  // Lougaroc
  748,  // Prédastérie (Toxapex)
  823,  // Corvaillus (Corviknight)
];

interface PokemonRaw {
  id: number;
  name: string; // English slug
  types: { slot: number; type: { name: string } }[];
  sprites: { other?: { "official-artwork"?: { front_default: string | null } } };
}

interface SpeciesRaw {
  id: number;
  name: string;
  is_mythical: boolean;
  is_legendary: boolean;
  is_baby: boolean;
  names: { language: { name: string }; name: string }[];
  evolves_from_species: { name: string } | null;
  evolution_chain: { url: string };
}

interface ChainNode {
  species: { name: string };
  evolves_to: ChainNode[];
}
interface EvolutionChainRaw {
  chain: ChainNode;
}

async function fetchJson<T>(url: string): Promise<T | null> {
  for (let i = 0; i < 4; i++) {
    try {
      const r = await fetch(url);
      if (r.ok) return (await r.json()) as T;
      if (r.status === 404) return null;
    } catch {
      // retry
    }
    await new Promise((res) => setTimeout(res, 500 * (i + 1)));
  }
  return null;
}

async function pLimit<T>(items: T[], limit: number, fn: (x: T) => Promise<void>) {
  let i = 0;
  const workers = Array.from({ length: limit }, async () => {
    while (true) {
      const idx = i++;
      if (idx >= items.length) return;
      await fn(items[idx]);
    }
  });
  await Promise.all(workers);
}

function frName(species: SpeciesRaw, fallback: string): string {
  const fr = species.names.find((n) => n.language.name === "fr");
  return fr?.name || fallback;
}

function isFinalEvolution(speciesName: string, chain: EvolutionChainRaw | null): boolean {
  if (!chain) return false;
  function find(node: ChainNode): ChainNode | null {
    if (node.species.name === speciesName) return node;
    for (const child of node.evolves_to) {
      const r = find(child);
      if (r) return r;
    }
    return null;
  }
  const node = find(chain.chain);
  if (!node) return false;
  return node.evolves_to.length === 0;
}

function isBasicWithoutEvolution(speciesName: string, chain: EvolutionChainRaw | null): boolean {
  if (!chain) return true;
  // Single-stage: chain root is this species and has no evolutions
  if (chain.chain.species.name === speciesName && chain.chain.evolves_to.length === 0) {
    return true;
  }
  return false;
}

interface Out {
  slug: string;
  name: string;
  pokedexNumber: number;
  rarity: "common" | "uncommon" | "rare" | "epic" | "legendary" | "mythic";
  primaryType: string | null;
  secondaryType: string | null;
  imageUrl: string | null;
}

async function main() {
  console.log(`Fetching ${TOTAL} Pokémon species + data from PokeAPI...`);

  const out: Out[] = [];
  const speciesMap = new Map<number, SpeciesRaw>();
  const pokemonMap = new Map<number, PokemonRaw>();
  const chainCache = new Map<string, EvolutionChainRaw | null>();

  const ids = Array.from({ length: TOTAL }, (_, i) => i + 1);

  let done = 0;
  await pLimit(ids, 8, async (id) => {
    const species = await fetchJson<SpeciesRaw>(`${API}/pokemon-species/${id}`);
    const poke = await fetchJson<PokemonRaw>(`${API}/pokemon/${id}`);
    if (species) speciesMap.set(id, species);
    if (poke) pokemonMap.set(id, poke);
    done++;
    if (done % 50 === 0) console.log(`  fetched ${done}/${TOTAL}`);
  });

  console.log(`Fetching evolution chains...`);
  const chainUrls = new Set<string>();
  for (const s of speciesMap.values()) chainUrls.add(s.evolution_chain.url);
  await pLimit(Array.from(chainUrls), 8, async (url) => {
    const c = await fetchJson<EvolutionChainRaw>(url);
    chainCache.set(url, c);
  });

  console.log(`Classifying...`);
  for (const id of ids) {
    const species = speciesMap.get(id);
    const poke = pokemonMap.get(id);
    if (!species || !poke) {
      console.warn(`  skipping ${id} (missing data)`);
      continue;
    }

    const slug = poke.name;
    const name = frName(species, poke.name);
    const types = poke.types
      .sort((a, b) => a.slot - b.slot)
      .map((t) => t.type.name);
    const imageUrl = poke.sprites.other?.["official-artwork"]?.front_default ?? null;

    let rarity: Out["rarity"];
    if (MYTHIC_IDS.includes(id)) {
      rarity = "mythic";
    } else if (LEGENDARY_IDS.includes(id)) {
      rarity = "legendary";
    } else if (species.is_mythical) {
      // Overflow mythicals (Magearna, Marshadow, Zeraora, Meltan, Melmetal, Zarude…)
      rarity = "legendary";
    } else if (species.is_legendary) {
      // Overflow legendaries (Tapus, Type:Null, Silvally, Glastrier, Spectrier, Calyrex, Regis-eleki, Regi-drago, Koraidon, Miraidon, Ogerpon, Terapagos…)
      rarity = "epic";
    } else if (EPIC_IDS.includes(id)) {
      rarity = "epic";
    } else {
      const chain = chainCache.get(species.evolution_chain.url) ?? null;
      const final = isFinalEvolution(species.name, chain);
      const single = isBasicWithoutEvolution(species.name, chain);
      const isBasic = species.evolves_from_species === null;
      if (final && !single) rarity = "rare";
      else if (!isBasic && !final) rarity = "uncommon";
      else if (single) rarity = "uncommon"; // strong single-stage
      else rarity = "common";
    }

    out.push({
      slug,
      name,
      pokedexNumber: id,
      rarity,
      primaryType: types[0] ?? null,
      secondaryType: types[1] ?? null,
      imageUrl,
    });
  }

  // Rebalance to exact distribution
  const TARGETS: Record<Out["rarity"], number> = {
    common: 500,
    uncommon: 250,
    rare: 150,
    epic: 50,
    legendary: 35,
    mythic: 15,
  };
  const counts: Record<string, number> = {};
  for (const o of out) counts[o.rarity] = (counts[o.rarity] ?? 0) + 1;
  console.log(`Pre-rebalance:`, counts);

  // Demote excess from each tier (top-down)
  const order: Out["rarity"][] = ["mythic", "legendary", "epic", "rare", "uncommon", "common"];
  for (const tier of order) {
    while ((counts[tier] ?? 0) > TARGETS[tier]) {
      const candidates = out.filter((o) => o.rarity === tier);
      const lower = order[order.indexOf(tier) + 1];
      if (!lower) break;
      const victim = candidates.sort((a, b) => b.pokedexNumber - a.pokedexNumber)[0];
      victim.rarity = lower;
      counts[tier]--;
      counts[lower] = (counts[lower] ?? 0) + 1;
    }
  }
  // Promote shortages by pulling from the tier below
  const promoteOrder: [Out["rarity"], Out["rarity"]][] = [
    ["common", "uncommon"],
    ["uncommon", "rare"],
    ["rare", "epic"],
  ];
  for (const [from, to] of promoteOrder) {
    while ((counts[to] ?? 0) < TARGETS[to]) {
      const cand = out.filter((o) => o.rarity === from);
      if (cand.length === 0) break;
      const lifted = cand.sort((a, b) => a.pokedexNumber - b.pokedexNumber)[0];
      lifted.rarity = to;
      counts[from]--;
      counts[to] = (counts[to] ?? 0) + 1;
    }
  }

  // Truncate to exactly 1000 if over
  if (out.length > 1000) {
    out.sort((a, b) => {
      const tierOrder: Record<Out["rarity"], number> = {
        mythic: 0, legendary: 1, epic: 2, rare: 3, uncommon: 4, common: 5,
      };
      return tierOrder[a.rarity] - tierOrder[b.rarity] || a.pokedexNumber - b.pokedexNumber;
    });
    // drop last commons until 1000
    while (out.length > 1000) out.pop();
  }

  const final: Record<string, number> = {};
  for (const o of out) final[o.rarity] = (final[o.rarity] ?? 0) + 1;
  console.log(`Final distribution:`, final);
  console.log(`Total: ${out.length}`);

  mkdirSync(join(process.cwd(), "data"), { recursive: true });
  const path = join(process.cwd(), "data", "pokemon.json");
  writeFileSync(path, JSON.stringify(out, null, 2));
  console.log(`Wrote ${out.length} Pokémon to ${path}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
