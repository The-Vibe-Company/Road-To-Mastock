"use client";

import { useEffect } from "react";

// Le chien de garde de l'hydratation. Symptôme visé : la page revient du
// cache navigateur avec un HTML périmé, ses chunks JavaScript n'existent
// plus (404), React ne démarre jamais — spinner éternel. Le layout arme un
// minuteur inline ; si l'hydratation n'est pas constatée à temps, on
// recharge en contournant le cache disque (cache-buster dans l'URL).
// La garde est temporelle, pas binaire : un nouvel essai est permis après
// 20 s — en PWA, sessionStorage vit des jours, un one-shot condamnerait
// toute récidive au spinner éternel.
export function HydrationWatchdog() {
  useEffect(() => {
    const w = window as unknown as { __hydrated?: boolean; __hydrCheck?: number };
    w.__hydrated = true;
    if (w.__hydrCheck) clearTimeout(w.__hydrCheck);
    try {
      sessionStorage.removeItem("__rehydrated");
    } catch {}
    // Efface le cache-buster d'un éventuel sauvetage précédent.
    try {
      const u = new URL(window.location.href);
      if (u.searchParams.has("_r")) {
        u.searchParams.delete("_r");
        window.history.replaceState(null, "", u.toString());
      }
    } catch {}
    // Le retour du cache navigateur (bfcache) ne rejoue ni le script
    // inline ni cet effet — on re-signale l'hydratation à chaque pageshow.
    const onShow = () => {
      w.__hydrated = true;
    };
    window.addEventListener("pageshow", onShow);
    return () => window.removeEventListener("pageshow", onShow);
  }, []);
  return null;
}

// Le script inline, injecté avant tout : il court même si React ne vient
// jamais.
export const WATCHDOG_SCRIPT = `
window.__hydrCheck = setTimeout(function () {
  if (!window.__hydrated) {
    try {
      var last = Number(sessionStorage.getItem("__rehydrated") || 0);
      if (Date.now() - last > 20000) {
        sessionStorage.setItem("__rehydrated", String(Date.now()));
        var u = new URL(location.href);
        u.searchParams.set("_r", String(Date.now()));
        location.replace(u.toString());
      }
    } catch (e) {}
  }
}, 4000);
`;
