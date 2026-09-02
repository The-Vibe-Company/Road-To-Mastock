"use client";

import Image from "next/image";
import { useTalents } from "./talents-provider";

// Icône de chargement de l'appli. Le Sourire (Axolotl) la remplace par
// l'axolotl qui rebondit — pour toujours, dès que la carte est possédée.
export function Spinner({ label }: { label?: string }) {
  const { has, assets } = useTalents();
  const axolotl = has("sourire") ? assets["sourire"] : null;

  return (
    <div className="flex flex-col items-center gap-3">
      {axolotl ? (
        <Image
          src={axolotl}
          alt=""
          width={56}
          height={56}
          unoptimized
          className="axolotl-spin size-14 object-contain"
        />
      ) : (
        <div className="size-8 animate-spin rounded-full border-2 border-primary/20 border-t-primary" />
      )}
      {label && <p className="text-sm font-medium text-primary/60">{label}</p>}
    </div>
  );
}
