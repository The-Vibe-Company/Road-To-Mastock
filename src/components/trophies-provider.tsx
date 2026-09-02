"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";

// Le cabinet des trophées, côté client : un fetch, consommé par les
// réglages (couleurs, Étendard), les courbes lissées et la page du cabinet.

export interface TrophyEntry {
  id: string;
  name: string;
  description: string;
  rewardLabel: string;
  rewardType: "picker" | "light" | "banner" | "smooth" | "weekly" | "badge" | "title";
  target: number;
  progress: number;
  earned: boolean;
}

interface TrophiesContextValue {
  loaded: boolean;
  trophies: TrophyEntry[];
  earned: string[];
  unannounced: string[];
  hasTrophy: (id: string) => boolean;
  hasFeature: (type: "picker" | "banner" | "smooth" | "weekly" | "light") => boolean;
  refresh: () => Promise<void>;
}

const TrophiesContext = createContext<TrophiesContextValue>({
  loaded: false,
  trophies: [],
  earned: [],
  unannounced: [],
  hasTrophy: () => false,
  hasFeature: () => false,
  refresh: async () => {},
});

export function useTrophies() {
  return useContext(TrophiesContext);
}

export function TrophiesProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<{ loaded: boolean; trophies: TrophyEntry[]; unannounced: string[] }>({
    loaded: false,
    trophies: [],
    unannounced: [],
  });

  const refresh = useCallback(async () => {
    try {
      const r = await fetch("/api/trophies", { cache: "no-store" });
      if (!r.ok) {
        // Débloque l'interface même sans données — pas de spinner éternel.
        setState((s) => ({ ...s, loaded: true }));
        return;
      }
      const data = await r.json();
      setState({ loaded: true, trophies: data.trophies ?? [], unannounced: data.unannounced ?? [] });
    } catch {
      setState((s) => ({ ...s, loaded: true }));
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      void refresh();
    }, 0);
    // Retour du cache navigateur : on repart d'une requête neuve.
    const onShow = (e: PageTransitionEvent) => {
      if (e.persisted) void refresh();
    };
    window.addEventListener("pageshow", onShow);
    return () => {
      clearTimeout(t);
      window.removeEventListener("pageshow", onShow);
    };
  }, [refresh]);

  const earned = state.trophies.filter((t) => t.earned).map((t) => t.id);
  const hasTrophy = useCallback((id: string) => earned.includes(id), [earned]);
  const hasFeature = useCallback(
    (type: "picker" | "banner" | "smooth" | "weekly" | "light") =>
      state.trophies.some((t) => t.rewardType === type && t.earned),
    [state.trophies],
  );

  return (
    <TrophiesContext.Provider
      value={{ loaded: state.loaded, trophies: state.trophies, unannounced: state.unannounced, earned, hasTrophy, hasFeature, refresh }}
    >
      {children}
    </TrophiesContext.Provider>
  );
}
