"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";

// Contexte des Talents cachés : un seul fetch, consommé par tous les
// composants qui déverrouillent un privilège (fonds d'écran, easter eggs,
// compteurs, tris, animations...).

export interface DiscoveredTalent {
  id: string;
  family: "parure" | "trone" | "oracle" | "relique" | "etendard";
  name: string;
  description: string;
  effect: { kind: string; accents?: string[] };
  card?: {
    category: "animal" | "pokemon";
    slug: string;
    name: string;
    rarity: string;
    imageUrl: string | null;
  };
}

export interface TalentsHome {
  siesteDays?: number | null;
  weekSessions?: number;
  tonnageKg?: number;
  tonnageWhales?: number;
  recordStreak?: number;
  dream?: { name: string; imageUrl: string | null; rarity: string };
}

export interface TalentsProfile {
  totem: { name: string; imageUrl: string | null; rarity: string } | null;
  totemCategory: string | null;
  totemCardId: number | null;
  title: string | null;
  weeklyGoal: number | null;
  wallpapers: { home: string | null; session: string | null; collection: string | null };
}

interface TalentsContextValue {
  loaded: boolean;
  total: number;
  discovered: DiscoveredTalent[];
  unannounced: string[];
  assets: Record<string, string | null>;
  home: TalentsHome;
  profile: TalentsProfile | null;
  has: (id: string) => boolean;
  refresh: () => Promise<void>;
}

const TalentsContext = createContext<TalentsContextValue>({
  loaded: false,
  total: 0,
  discovered: [],
  unannounced: [],
  assets: {},
  home: {},
  profile: null,
  has: () => false,
  refresh: async () => {},
});

export function useTalents() {
  return useContext(TalentsContext);
}

export function TalentsProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<Omit<TalentsContextValue, "has" | "refresh">>({
    loaded: false,
    total: 0,
    discovered: [],
    unannounced: [],
    assets: {},
    home: {},
    profile: null,
  });

  const refresh = useCallback(async () => {
    try {
      const r = await fetch("/api/talents", { cache: "no-store" });
      if (!r.ok) {
        // Débloque quand même l'interface : mieux vaut une page nue qu'un
        // spinner éternel — les pages gardées par `loaded` doivent rendre.
        setState((s) => ({ ...s, loaded: true }));
        return;
      }
      const data = await r.json();
      setState({
        loaded: true,
        total: data.total ?? 0,
        discovered: data.discovered ?? [],
        unannounced: data.unannounced ?? [],
        assets: data.assets ?? {},
        home: data.home ?? {},
        profile: data.profile ?? null,
      });
    } catch {
      setState((s) => ({ ...s, loaded: true }));
    }
  }, []);

  useEffect(() => {
    // Différé d'un tick : setState arrive après le fetch, jamais en
    // synchrone dans le corps de l'effet.
    const t = setTimeout(() => {
      void refresh();
    }, 0);
    // Retour du cache navigateur (bfcache) : l'état restauré peut être
    // périmé ou figé en plein fetch — on repart d'une requête neuve.
    const onShow = (e: PageTransitionEvent) => {
      if (e.persisted) void refresh();
    };
    window.addEventListener("pageshow", onShow);
    return () => {
      clearTimeout(t);
      window.removeEventListener("pageshow", onShow);
    };
  }, [refresh]);

  const has = useCallback(
    (id: string) => state.discovered.some((t) => t.id === id),
    [state.discovered],
  );

  return (
    <TalentsContext.Provider value={{ ...state, has, refresh }}>
      {children}
    </TalentsContext.Provider>
  );
}
