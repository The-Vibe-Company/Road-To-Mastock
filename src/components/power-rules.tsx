import { Gauge } from "@/components/icons";
import { AWAKEN_REMINDER } from "@/lib/powers";

// L'encart « règle du jeu » d'un pouvoir : sous la phrase lyrique, la
// mécanique sèche — déclencheur, chiffres, cible. Style carte à jouer.
export function PowerRules({
  text,
  reminder = false,
  className = "",
}: {
  text: string;
  // Rappelle comment un pouvoir s'active — pour les fiches de découverte.
  reminder?: boolean;
  className?: string;
}) {
  return (
    <div
      className={`rounded-lg bg-primary/8 px-2.5 py-2 ring-1 ring-primary/25 ${className}`}
    >
      <p className="flex items-center gap-1 font-mono text-[9px] font-black uppercase tracking-[0.2em] text-primary/80">
        <Gauge className="size-3" />
        Effet
      </p>
      <p className="mt-1 text-[11px] leading-snug text-foreground/85">{text}</p>
      {reminder && (
        <p className="mt-1.5 text-[10px] leading-snug text-muted-foreground">
          {AWAKEN_REMINDER}
        </p>
      )}
    </div>
  );
}
