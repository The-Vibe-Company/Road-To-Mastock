"use client";

import { useState } from "react";
import {
  Shield, Ticket, Trophy, Key, Eye, Gem, Star, ChevronDown, Magnet, Hourglass, Lock,
} from "@/components/icons";
import { BackButton } from "@/components/back-button";

// Le Manuel : tout le jeu, expliqué au même endroit. Pas de secret révélé —
// on explique les règles, jamais quelles cartes portent quoi.

function Section({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="card-gradient-border rounded-2xl">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-3 px-4 py-3.5 text-left"
      >
        <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          {icon}
        </span>
        <span className="flex-1 text-sm font-black tracking-tight">{title}</span>
        <ChevronDown className={`size-4 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="space-y-3 border-t border-border/50 px-4 pb-4 pt-3 text-[13px] leading-relaxed text-muted-foreground">
          {children}
        </div>
      )}
    </div>
  );
}

const B = ({ children }: { children: React.ReactNode }) => (
  <strong className="text-foreground">{children}</strong>
);

export default function ManuelPage() {
  return (
    <div className="min-h-dvh px-4 pb-12 pt-6">
      <BackButton />

      <header className="mb-6 mt-3">
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-primary/70">
          Tout comprendre
        </p>
        <h1 className="mt-1 text-3xl tracking-tighter">Le Manuel</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Toutes les règles du jeu, au même endroit. Les secrets, eux, restent
          des secrets.
        </p>
      </header>

      <div className="space-y-3">
        <Section icon={<Ticket className="size-4" />} title="Les jetons et les packs">
          <p>
            Chaque séance clôturée rapporte <B>1 jeton</B>. La 1ʳᵉ et la 4ᵉ
            séance de la semaine rapportent un <B>jeton spécial</B> à la place —
            il se joue à la roue de la fortune et se change en 1 à 4 jetons
            normaux.
          </p>
          <p>
            Un jeton ouvre un <B>pack</B>. L&apos;ouverture pioche un ticket dans
            un chapeau qui en contient 100 : <B>64 Basique</B>, 15 Animal,
            15 Pokémon, 5 Premium, 1 Mythique. Les packs mixtes (Basique,
            Premium, Mythique) tirent ensuite la famille de la carte : 75 %
            animal / 25 % pokémon en Basique.
          </p>
          <p>
            Un doublon devient un <B>fragment</B> de sa rareté. 3 fragments
            fusionnent en une carte de la rareté supérieure ; les fragments se
            convertissent aussi en jetons.
          </p>
        </Section>

        <Section icon={<Shield className="size-4" />} title="Les Gardiens">
          <p>
            Pose une carte sur un exercice (sa fiche → <B>Mascotte</B>) : elle
            devient son <B>Gardien</B> et décore le bloc en séance. Fais au
            moins une série sur cette machine puis clôture la séance : le
            Gardien <B>s&apos;éveille</B> et son pouvoir s&apos;applique. Une
            fois par séance, pas plus.
          </p>
          <p>
            L&apos;écran de clôture liste toute la récolte : qui s&apos;est
            éveillé, ce que chacun a produit.
          </p>
        </Section>

        <Section icon={<Magnet className="size-4" />} title="Les métiers et la polarité (commun → épique)">
          <p>
            Chaque carte du commun à l&apos;épique exerce un <B>métier</B> selon
            sa nature, avec ±1 % (commun), ±2 % (peu commun), ±4 % (rare) ou
            ±6 % (épique). Et c&apos;est toi
            qui choisis son sens sur la fiche : <B>Attractif</B> ou{" "}
            <B>Répulsif</B>, modifiable à volonté.
          </p>
          <p>
            <B>La Famille</B> — attire ou dévore les tickets du pack de sa
            famille. <B>Le Lest</B> — remplit le Basique, ou le dévore pour
            faire monter tout le reste. <B>L&apos;Étincelle</B> — sème 0,1 à
            0,6 ticket Mythique par éveil, ou brûle du Basique.{" "}
            <B>La Balance</B> — penche le 75/25 des packs mixtes vers les
            animaux ou les Pokémon (1 à 6 % par éveil).
          </p>
          <p>
            <B>L&apos;Endurance</B> — sur une machine de cardio, l&apos;éveil
            se multiplie avec la durée du jour : ×1 de base, +1 par quart
            d&apos;heure complet, +1 bonus à 30 min, +1 bonus à l&apos;heure.
            14 min → ×1, 16 min → ×2, 31 min → ×4, une heure → ×7.
          </p>
        </Section>

        <Section icon={<Star className="size-4" />} title="Les Prodiges et les Miracles (légendaire et mythique)">
          <p>
            Les <B>légendaires</B> ne comptent pas en tickets : chacun porte
            un <B>Prodige unique</B>, écrit pour lui seul — 70 légendaires,
            70 pouvoirs. Tickets Premium et Mythique, roue qui perd son ×1,
            pack qui refuse d&apos;être Basique, fragments offerts sur
            record… Le détail de chaque carte raconte son prodige.
          </p>
          <p>
            Les <B>mythiques</B> portent chacun un <B>Miracle unique</B>, un
            étage encore au-dessus : un jeton spécial offert chaque semaine,
            la roue qui monte à ×10, le chapeau qui échappe à la remise à
            zéro… Le détail de chaque carte raconte son pouvoir.
          </p>
        </Section>

        <Section icon={<Hourglass className="size-4" />} title="L'énergie : récoltée, consommée, remise à zéro">
          <p>
            L&apos;énergie des éveils se <B>consomme</B> quand tu ouvres un
            pack ou tournes la roue — le chapeau revient ensuite à la normale.
            Ouvre ton pack <B>après la séance</B> : c&apos;est le rythme du
            jeu.
          </p>
          <p>
            Car clôturer une nouvelle séance <B>remet le chapeau à zéro</B>{" "}
            avant la nouvelle récolte : l&apos;énergie de pack non dépensée est
            annulée. Seules les jauges d&apos;atelier (Forge, Curée,
            Orpailleur) survivent — et quelques cartes savent tricher avec le
            temps.
          </p>
        </Section>

        <Section icon={<Trophy className="size-4" />} title="Les records et le Gardien lié">
          <p>
            Un <B>record</B> — charge max ou volume, avec au moins 3 séances
            d&apos;historique — compte pour tes trophées, et certains Gardiens
            (la Banshee, le Sphinx, Marshadow, Victini…) n&apos;offrent leur
            pouvoir que ce jour-là.
          </p>
          <p>
            <Lock className="mr-1 inline size-3" />
            Un Gardien posé est <B>lié</B> dès son premier éveil : pour changer
            sa carte, bats ton record sur cette machine… ou attends 30 jours.
            Tant qu&apos;il ne s&apos;est pas éveillé, tu peux encore changer
            d&apos;avis librement.
          </p>
        </Section>

        <Section icon={<Key className="size-4" />} title="Les Talents cachés et le Grimoire">
          <p>
            Une cinquantaine de cartes portent un <B>Talent caché</B> : un
            privilège d&apos;appli — couleurs scellées, fonds d&apos;écran,
            pages de stats interdites, easter eggs. Posséder la carte suffit,
            pour toujours. Personne ne sait lesquelles avant de les tirer.
          </p>
          <p>
            Le <B>Grimoire</B> (depuis la Collection) compte tes découvertes et
            garde le reste en silhouettes. Les 30 mythiques portent tous une{" "}
            <B>aura</B> en plus de leur Miracle.
          </p>
        </Section>

        <Section icon={<Eye className="size-4" />} title="Les Oracles">
          <p>
            Neuf savoirs cachés dans certaines auras : la frise de tous tes
            records, le tonnage par muscle, les machines que tu fuis, toi contre
            toi d&apos;il y a six mois, le Hall des records, l&apos;export de
            tes données, l&apos;index du catalogue, l&apos;analyse par machine,
            et la carte céleste de ton année. Le temple est dans{" "}
            <B>Collection → Oracle</B> — il s&apos;allume carte par carte.
          </p>
        </Section>

        <Section icon={<Gem className="size-4" />} title="Les Trophées et les titres">
          <p>
            <B>200 trophées</B>, gagnés à l&apos;entraînement, jamais au tirage :
            séances, records, tonnage, séries, charge max, cardio, régularité,
            variété, collection. La Salle des Trophées montre chaque jauge.
          </p>
          <p>
            Les grands paliers déverrouillent des morceaux d&apos;appli — le
            choix des couleurs, l&apos;Étendard, les courbes lissées, le bilan
            hebdo. Presque tous les autres offrent un <B>titre portable</B>,
            à afficher sous ton nom depuis les réglages.
          </p>
        </Section>
      </div>
    </div>
  );
}
