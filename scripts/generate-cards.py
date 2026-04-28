#!/usr/bin/env python3
"""
Batch-generate the 1000 animal card images via Azure OpenAI's gpt-image-2-1
deployment.

Idempotent: skips entries whose PNG already exists in the output dir.
Resumable: re-run after a crash to continue.
Filterable: --only common,uncommon to limit by rarity, or --slugs a,b,c
to generate just specific entries (used for the 6-test set).

Run:
    python3 scripts/generate-cards.py
    python3 scripts/generate-cards.py --slugs domestic-cat,red-fox,gray-wolf,great-white-shark,phoenix,ancient-dragon
    python3 scripts/generate-cards.py --only legendary,mythic
    python3 scripts/generate-cards.py --workers 4

Env (loaded from .env.local at project root):
    AZURE_OPENAI_API_KEY, AZURE_OPENAI_IMAGE_ENDPOINT, AZURE_OPENAI_IMAGE_DEPLOYMENT
"""

from __future__ import annotations
import argparse
import base64
import concurrent.futures as cf
import json
import os
import sys
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
ENV_FILE = ROOT / ".env.local"
ANIMALS_JSON = ROOT / "data" / "animals.json"
OUT_DIR = ROOT / "public" / "cards" / "animals"

DEFAULT_ENDPOINT = "https://quivr-sweden-central-resource.openai.azure.com/openai/v1"
DEFAULT_DEPLOYMENT = "gpt-image-2-1"


def load_env() -> None:
    if not ENV_FILE.exists():
        return
    for raw in ENV_FILE.read_text().splitlines():
        line = raw.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        k, v = line.split("=", 1)
        k = k.strip()
        v = v.strip().strip('"').strip("'")
        if k and k not in os.environ:
            os.environ[k] = v


# ---------- prompt builder (v4: textured Clash Royale 3D figurine) ----------

BASE = (
    "Stylized 3D character render of a {name}{hint}. "
    "Reference look: Clash Royale 3D in-game characters, Skylanders figurines, Spyro Reignited Trilogy, Crash Bandicoot N. Sane Trilogy, Pixar character animation, Sea of Thieves character style. "
    "A 3D character with stylized exaggerated proportions (slightly oversized head, expressive cocky face with big characterful eyes) BUT richly textured surfaces — visible fur strands / feather barbs / scales / skin micro-details, subtle subsurface scattering, soft contact shadows, ambient occlusion, cinematic volumetric lighting. "
    "Materials feel tactile and physical (leather, brushed metal, bone, polished horn, weathered fabric) with proper PBR shading. Saturated punchy colors."
)

TIER = {
    "common": {
        "gear": "Wears a worn leather collar with visible stitching and a small bell, plus a single fresh flower behind the ear with detailed petals.",
        "directives": "Friendly confident pose, paws/feet planted firmly, gentle smile. Soft warm key light, soft contact shadow under the body.",
        "background": "Smooth soft cream-beige studio backdrop with subtle vignette",
    },
    "uncommon": {
        "gear": "Wears a small weathered leather adventurer's satchel with visible buckles and stitches, a textured woolen scarf, and a tiny soft-cloth bandit mask.",
        "directives": "Alert adventurer stance, slight swagger, cocky smirk. Warm directional lighting with soft subsurface highlights. A few floating dust particles.",
        "background": "Warm green-amber studio backdrop with soft volumetric haze",
    },
    "rare": {
        "gear": "Wears studded leather armor with metal rivets, one weathered iron shoulder pad with battle scratches, painted war stripes (visible pigment texture), a small dagger or short sword strapped on, and a leather eyepatch or scar.",
        "directives": "Confident hero pose, weight on one leg, intense focused stare. Strong rim light catching the armor materials, soft halo glow behind the subject.",
        "background": "Misty blue-gray studio atmosphere with depth fog",
    },
    "epic": {
        "gear": "Wears full ornate iron plate armor with rivets and battle scratches, a horned crested helmet with worn metal patina, oversized spiked pauldrons, and clutches a giant cartoony two-handed weapon (war axe / hammer / sword) with leather-wrapped haft. Glowing blue rune-tattoos pulse on the body with subtle emissive glow.",
        "directives": "Dynamic action pose mid-roar, weapon raised, fur/feathers/scales clearly in motion. Strong rim light, painted lens flare, swirling stylized dust, embers and smoke FX with volumetric depth.",
        "background": "Stormy atmospheric backdrop with embers and motion-blur swirls",
    },
    "legendary": {
        "gear": "Adorned with enchanted polished gold armor engraved with glowing runes (emissive surface texture), an ornate jeweled crown, an ancient magical weapon with translucent crystal blade, and floating arcane orbs near the shoulders with refractive glow.",
        "directives": "Majestic mythological battle pose, statuesque, head tilted up confidently. Ethereal radiance, glowing runes orbiting the body, magical particles with proper depth.",
        "background": "Enchanted twilight backdrop with arcane glow, volumetric god-rays and floating motes of light",
    },
    "mythic": {
        "gear": "Adorned with cosmic divine armor covered in glowing celestial constellation patterns (emissive starlight texture), a godly fractal-light crown of branching antlers, a reality-warping scepter with fractal crystal core, and a halo of fractal energy around the head. Glowing rune-engraved scales.",
        "directives": "Cosmic god-like stance, primal and overwhelming, particles erupting from the body. Painted divine god-rays, fractal energy bursts, swirling golden cosmic dust with deep volumetric lighting.",
        "background": "Cosmic nebula backdrop with golden energy filaments, fractal accents and deep parallax",
    },
}

COMPOSITION = (
    "Composition: full body hero pose, three-quarter view, looking at camera, "
    "standing on a small stylized platform with cast shadow. {bg}. Square 1:1, sharp focus."
)

NEGATIVE = (
    "Mandatory: 3D rendered look with rich tactile textures and proper depth. "
    "NOT a 2D drawing, NOT a flat illustration, NOT line art, NOT cel-shaded flat colors, NOT a sketch. "
    "The character is a stylized creature like in a Pixar film — not a photo of a real animal. "
    "No text, logos, UI, watermarks, multiple subjects."
)

# Mythic creatures (no scientific name) need explicit "mythological" cue
LEGENDARY_LORE = {
    "phoenix": "mythological firebird that resurrects from its own ashes",
    "griffin": "mythological half-eagle half-lion guardian",
    "kraken": "legendary giant cephalopod sea-monster",
    "sphinx": "mythological riddle-keeper with lion body and human-like face",
    "unicorn": "mythological horse with a single spiral horn",
    "minotaur": "mythological bull-headed humanoid of the labyrinth",
    "chimera": "mythological lion-goat-serpent fire-breathing hybrid",
    "wendigo": "Algonquian mythology gaunt forest-spirit",
    "basilisk": "mythological serpent with petrifying gaze",
    "manticore": "mythological lion-bodied creature with scorpion tail",
    "pegasus": "mythological winged divine horse",
    "cyclops": "mythological one-eyed giant blacksmith",
    "gorgon": "mythological snake-haired Medusa",
    "siren": "mythological aquatic enchantress",
    "centaur": "mythological half-human half-horse warrior",
    "cerberus": "mythological three-headed guardian hound of the underworld",
    "hippogriff": "mythological half-griffin half-horse winged creature",
    "kelpie": "Celtic mythological water-horse spirit",
    "jackalope": "American folklore antlered jackrabbit",
    "thunderbird": "Native American mythology storm-bird",
    "mothman": "American cryptid moth-humanoid",
    "chupacabra": "Latin American cryptid blood-sucker",
    "wyvern": "two-legged dragon variant",
    "fae": "fairy spirit of forests",
    "naga": "Hindu mythology divine serpent",
    "golem": "Jewish mythological clay automaton",
    "yeti": "Himalayan cryptid abominable snowman",
    "sasquatch": "North American cryptid bigfoot",
    "banshee": "Celtic mythology wailing spirit-woman",
    "djinn": "Arabian mythology fire-spirit genie",
    "nymph": "Greek mythology nature spirit",
    "troll": "Scandinavian mythological mountain giant",
    "ogre": "fairy-tale brutish giant",
    "behemoth": "biblical primordial earth-beast",
    "roc": "mythological monstrous bird of prey",
}

MYTHIC_LORE = {
    "ancient-dragon": "primordial sovereign dragon of storms",
    "leviathan": "biblical primordial sea-monster",
    "qilin": "East Asian mythological sacred chimera-unicorn",
    "ouroboros": "primordial serpent eating its own tail",
    "world-serpent": "Norse mythological Jörmungandr serpent encircling the world",
    "fenrir": "Norse mythological giant wolf of Ragnarök",
    "bahamut": "Arabian mythological cosmic dragon",
    "tiamat": "Mesopotamian primordial chaos dragon-goddess",
    "baku": "Japanese mythological dream-eating chimera",
    "orochi": "Japanese eight-headed serpent-dragon Yamata-no-Orochi",
    "hydra-primordial": "primordial multi-headed regenerating dragon-serpent",
    "typhon": "Greek primordial father-of-monsters titan",
    "ziz": "biblical gigantic primordial bird",
    "nidhogg": "Norse mythological dragon gnawing the world-tree",
    "apophis": "Egyptian mythological serpent of chaos",
}


def build_prompt(animal: dict) -> str:
    rarity = animal["rarity"]
    name = animal["name"]
    slug = animal["slug"]

    # Build the species hint
    if "scientificName" in animal and animal["scientificName"]:
        hint = f" ({animal['scientificName']})"
    elif slug in LEGENDARY_LORE:
        hint = f" — {LEGENDARY_LORE[slug]}"
    elif slug in MYTHIC_LORE:
        hint = f" — {MYTHIC_LORE[slug]}"
    else:
        hint = ""

    tier = TIER[rarity]
    base = BASE.format(name=name, hint=hint)
    composition = COMPOSITION.format(bg=tier["background"])

    return "\n\n".join([base, tier["gear"], tier["directives"], composition, NEGATIVE])


# ---------- Azure OpenAI client ----------

def get_client():
    try:
        from openai import OpenAI
    except ImportError:
        print("Missing dependency: pip3 install --user openai", file=sys.stderr)
        sys.exit(1)
    api_key = os.environ.get("AZURE_OPENAI_API_KEY") or os.environ.get("OPENAI_API_KEY")
    if not api_key:
        print("Missing AZURE_OPENAI_API_KEY in .env.local", file=sys.stderr)
        sys.exit(1)
    endpoint = os.environ.get("AZURE_OPENAI_IMAGE_ENDPOINT", DEFAULT_ENDPOINT)
    return OpenAI(base_url=endpoint, api_key=api_key)


def generate_one(client, deployment: str, animal: dict, dry_run: bool = False) -> tuple[str, bool, str]:
    """Returns (slug, success, message). Retries on 429 with exponential backoff."""
    slug = animal["slug"]
    out = OUT_DIR / f"{slug}.png"
    if out.exists():
        return (slug, True, "skip (exists)")

    prompt = build_prompt(animal)
    if dry_run:
        print(f"\n--- {slug} ---\n{prompt}\n")
        return (slug, True, "dry-run")

    max_attempts = 6
    delay = 10.0  # initial seconds
    last_err = "unknown"

    for attempt in range(1, max_attempts + 1):
        try:
            img = client.images.generate(
                model=deployment,
                prompt=prompt,
                n=1,
                size="1024x1024",
            )
        except Exception as e:
            err_str = str(e)
            last_err = err_str
            # Retry on rate limit / overload / transient
            transient = ("429", "EngineOverloaded", "rate limit", "503", "502", "504",
                         "timeout", "Connection error", "ReadTimeout", "RemoteProtocolError")
            if any(needle in err_str or needle.lower() in err_str.lower() for needle in transient):
                if attempt < max_attempts:
                    time.sleep(delay)
                    delay = min(delay * 1.8, 90.0)
                    continue
            return (slug, False, f"api error: {err_str[:200]}")

        if not img.data or not getattr(img.data[0], "b64_json", None):
            return (slug, False, "no b64_json in response")

        image_bytes = base64.b64decode(img.data[0].b64_json)
        out.parent.mkdir(parents=True, exist_ok=True)
        out.write_bytes(image_bytes)
        suffix = f" (after {attempt} tries)" if attempt > 1 else ""
        return (slug, True, f"ok ({len(image_bytes)//1024} KB){suffix}")

    return (slug, False, f"exhausted retries: {last_err[:200]}")


# ---------- main ----------

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--only", help="Comma-separated rarities to keep (e.g. legendary,mythic)")
    ap.add_argument("--slugs", help="Comma-separated specific slugs to generate")
    ap.add_argument("--workers", type=int, default=1, help="Parallel workers (default 1; Azure rate-limits aggressively)")
    ap.add_argument("--limit", type=int, help="Max number of animals to process")
    ap.add_argument("--dry-run", action="store_true", help="Print prompts without calling API")
    args = ap.parse_args()

    load_env()
    animals = json.loads(ANIMALS_JSON.read_text())

    if args.only:
        keep = set(s.strip() for s in args.only.split(","))
        animals = [a for a in animals if a["rarity"] in keep]

    if args.slugs:
        keep = set(s.strip() for s in args.slugs.split(","))
        animals = [a for a in animals if a["slug"] in keep]

    if args.limit:
        animals = animals[: args.limit]

    print(f"Processing {len(animals)} animals → {OUT_DIR}")
    OUT_DIR.mkdir(parents=True, exist_ok=True)

    if args.dry_run:
        for a in animals:
            print(f"\n=== {a['slug']} [{a['rarity']}] ===")
            print(build_prompt(a))
        return

    client = get_client()
    deployment = os.environ.get("AZURE_OPENAI_IMAGE_DEPLOYMENT", DEFAULT_DEPLOYMENT)

    started = time.time()
    done = 0
    failed: list[tuple[str, str]] = []

    with cf.ThreadPoolExecutor(max_workers=args.workers) as ex:
        futures = {ex.submit(generate_one, client, deployment, a): a for a in animals}
        for fut in cf.as_completed(futures):
            slug, ok, msg = fut.result()
            done += 1
            elapsed = time.time() - started
            rate = done / elapsed if elapsed > 0 else 0
            eta = (len(animals) - done) / rate if rate > 0 else 0
            status = "✓" if ok else "✗"
            print(f"[{done}/{len(animals)}] {status} {slug}: {msg} ({rate:.1f}/s, eta {eta/60:.1f}m)")
            if not ok:
                failed.append((slug, msg))

    print(f"\nDone in {(time.time()-started)/60:.1f} min. {len(animals)-len(failed)} ok, {len(failed)} failed.")
    if failed:
        print("\nFailed slugs:")
        for slug, msg in failed:
            print(f"  - {slug}: {msg}")


if __name__ == "__main__":
    main()
