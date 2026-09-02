"use client";

import Image from "next/image";
import { useTalents } from "./talents-provider";

// Trônes : le fond d'écran d'une page, choisi dans les réglages parmi les
// talents débloqués. Très discret — c'est un décor, pas un poster.
export function ThroneBackdrop({ page }: { page: "home" | "session" | "collection" }) {
  const { profile, assets } = useTalents();
  const talentId = profile?.wallpapers?.[page] ?? null;
  const image = talentId ? assets[talentId] : null;
  if (!image) return null;

  // L'Étreinte du Kraken encadre depuis le bas ; les autres trônent en haut.
  const isKraken = talentId === "etreinte";

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-0 mx-auto max-w-lg select-none overflow-hidden">
      <div
        className={`absolute inset-x-0 ${isKraken ? "bottom-0 h-[55%]" : "top-0 h-[60%]"}`}
        style={{
          maskImage: isKraken
            ? "linear-gradient(to top, rgba(0,0,0,0.9) 0%, transparent 90%)"
            : "linear-gradient(to bottom, rgba(0,0,0,0.9) 0%, transparent 90%)",
          WebkitMaskImage: isKraken
            ? "linear-gradient(to top, rgba(0,0,0,0.9) 0%, transparent 90%)"
            : "linear-gradient(to bottom, rgba(0,0,0,0.9) 0%, transparent 90%)",
        }}
      >
        <Image
          src={image}
          alt=""
          fill
          unoptimized
          className={`object-contain opacity-[0.10] ${isKraken ? "object-bottom" : "object-top"}`}
        />
      </div>
    </div>
  );
}
