"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// Le Router Cache client de Next ressert toujours la version en cache lors d'un
// retour arriere (router.back()), meme sur une page `force-dynamic`. Comme les
// mutations passent par des route handlers (fetch /api/...) et non par des
// server actions, rien ne l'invalide : en revenant du detail d'une seance on
// retombait sur la home telle qu'elle etait avant sa creation, jusqu'a un
// rechargement complet (deconnexion / reconnexion).
//
// On recharge donc les donnees serveur a chaque arrivee sur la home, et a
// chaque fois que l'app redevient visible (retour depuis une autre app, ecran
// deverrouille, onglet reactive) — ce dernier cas compte pour la PWA, ou l'app
// est restauree telle quelle sans remontage.
export function RefreshOnReturn() {
  const router = useRouter();

  useEffect(() => {
    router.refresh();

    const refreshIfVisible = () => {
      if (document.visibilityState === "visible") router.refresh();
    };

    document.addEventListener("visibilitychange", refreshIfVisible);
    window.addEventListener("pageshow", refreshIfVisible);
    return () => {
      document.removeEventListener("visibilitychange", refreshIfVisible);
      window.removeEventListener("pageshow", refreshIfVisible);
    };
  }, [router]);

  return null;
}
