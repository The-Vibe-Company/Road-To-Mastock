import type { Rarity } from "@/lib/rarities";

export type MascotCategory = "animal" | "pokemon";

// Carte associée à une machine, telle que la renvoient les API et que
// l'affichent le filigrane et le sélecteur. Volontairement séparé de
// `@/lib/mascots` (qui touche la base) pour rester importable côté client.
export interface Mascot {
  category: MascotCategory;
  id: number;
  slug: string;
  name: string;
  rarity: Rarity;
  imageUrl: string | null;
  number: number | null;
  // Type primaire (pokémon) ou lignée (animal) : détermine le pouvoir de
  // gardien de la carte. Null sur les vieilles données non classifiées.
  subtype: string | null;
  // La Légende de la Carpe : l'image a basculé sur la forme évoluée, le
  // client applique la teinte rouge.
  evolved?: boolean;
}
