#!/usr/bin/env python3
"""
Generate 5 booster pack cover images via Azure OpenAI's gpt-image-2-1.
Output: public/cards/packs/{pack_type}.png (1024x1536, vertical).

Idempotent: skips files that already exist. Resumable.

Run: python3 scripts/generate-pack-art.py
"""
import base64
import os
import sys
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
ENV_FILE = ROOT / ".env.local"
OUT_DIR = ROOT / "public" / "cards" / "packs"

DEFAULT_ENDPOINT = "https://quivr-sweden-central-resource.openai.azure.com/openai/v1"
DEFAULT_DEPLOYMENT = "gpt-image-2-1"


def load_env():
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


COMMON = (
    "Vertical trading card game booster pack front cover, premium foil packaging "
    "design, photographed standing upright. Style: stylized 3D render, glossy "
    "metallic finish, cinematic studio lighting against a dark gradient background. "
    "Pack has clean rectangular shape with sealed crimped top edge. Original design, "
    "NOT a real-world brand product. NO readable text, NO logos, NO letters, NO "
    "numbers. Centered emblem on the front. Tactile materials feel premium."
)

PACKS = {
    "basic": (
        "Theme: classic, friendly, accessible. Color palette: warm orange and deep "
        "black with subtle bronze accents. Centered emblem: a stylized silhouette of "
        "a card pack with sparkles. Clean geometric pattern border."
    ),
    "animal_only": (
        "Theme: wilderness and beasts. Color palette: deep emerald green with gold "
        "accents and ivory highlights. Centered emblem: a stylized roaring beast "
        "silhouette (lion / wolf hybrid) with three diagonal claw mark slashes. "
        "Decorative motifs of leaves, feathers and antlers around the border. "
        "Foil texture mimicking fur."
    ),
    "pokemon_only": (
        "Theme: elemental creature taming, lightning energy. Color palette: vivid "
        "sky blue and electric yellow with white highlights. Centered emblem: a "
        "stylized abstract paw silhouette inside a circle, surrounded by four "
        "diagonal lightning bolts radiating outward like a star. Decorative motifs "
        "of energy waves and small spark stars on the border. Holographic blue and "
        "yellow foil texture, glossy finish. Original generic design, NOT a real "
        "branded product."
    ),
    "premium": (
        "Theme: luxury, craftsmanship, treasure. Color palette: deep amber gold and "
        "rich bronze with cream highlights. Centered emblem: a faceted crystal gem "
        "with light rays. Ornate baroque filigree border, scrollwork. Ultra-glossy "
        "gold-leaf foil finish, jewelry-store sheen."
    ),
    "mythic": (
        "Theme: cosmic, primordial, godlike. Color palette: deep purple and magenta "
        "with iridescent rainbow highlights and gold flecks. Centered emblem: an "
        "ouroboros — a serpent-dragon biting its own tail forming a circle — with "
        "rune engravings around it. Cosmic nebula and constellation patterns "
        "swirling on the pack surface. Holographic iridescent finish, subtle light "
        "rays. Ultra-rare jackpot feel."
    ),
}


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


def generate(client, deployment: str, slug: str, theme: str) -> bool:
    out = OUT_DIR / f"{slug}.png"
    if out.exists():
        print(f"[{slug}] skip (exists)")
        return True

    prompt = f"{COMMON} {theme}"

    for attempt in range(1, 6):
        try:
            img = client.images.generate(
                model=deployment,
                prompt=prompt,
                n=1,
                size="1024x1536",
            )
        except Exception as e:
            err = str(e)
            transient = ("429", "EngineOverloaded", "rate limit", "503", "502",
                         "Connection error", "ReadTimeout", "timeout")
            if any(t in err or t.lower() in err.lower() for t in transient) and attempt < 5:
                wait = 10 * attempt
                print(f"[{slug}] transient (attempt {attempt}): {err[:120]}, retry in {wait}s")
                time.sleep(wait)
                continue
            print(f"[{slug}] FAILED: {err[:200]}", file=sys.stderr)
            return False

        if not img.data or not getattr(img.data[0], "b64_json", None):
            print(f"[{slug}] no b64_json", file=sys.stderr)
            return False

        image_bytes = base64.b64decode(img.data[0].b64_json)
        out.parent.mkdir(parents=True, exist_ok=True)
        out.write_bytes(image_bytes)
        print(f"[{slug}] OK ({len(image_bytes)//1024} KB)")
        return True

    return False


def main():
    load_env()
    client = get_client()
    deployment = os.environ.get("AZURE_OPENAI_IMAGE_DEPLOYMENT", DEFAULT_DEPLOYMENT)

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    print(f"Generating booster pack covers → {OUT_DIR}")

    ok = 0
    failed = []
    for slug, theme in PACKS.items():
        if generate(client, deployment, slug, theme):
            ok += 1
        else:
            failed.append(slug)

    print(f"\nDone. {ok}/{len(PACKS)} ok.")
    if failed:
        print(f"Failed: {', '.join(failed)}")
        sys.exit(1)


if __name__ == "__main__":
    main()
