"use client";

import { useCallback, useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, X, Loader2, MapPin, Pencil } from "lucide-react";

interface Variant {
  id: number;
  name: string;
}

// Paliers de poids de la machine, propres a l'utilisateur. Ils alimentent la
// suggestion de poids de la serie suivante (set-form) et se remplissent tout
// seuls a chaque serie enregistree.
//
// Certaines machines — les poulies surtout — ne sont pas reglees pareil d'une
// salle a l'autre. Quand l'exercice est marque comme tel, les paliers sont
// ranges par version : on edite ceux de la version selectionnee.
export function WeightSteps({
  exerciseId,
  hasVariants: initialHasVariants,
}: {
  exerciseId: number;
  hasVariants: boolean;
}) {
  const [hasVariants, setHasVariants] = useState(initialHasVariants);
  const [variants, setVariants] = useState<Variant[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [weights, setWeights] = useState<number[] | null>(null);
  const [weightInput, setWeightInput] = useState("");
  const [variantInput, setVariantInput] = useState("");
  const [renameInput, setRenameInput] = useState("");
  const [busy, setBusy] = useState(false);

  const loadVariants = useCallback(async () => {
    const res = await fetch(`/api/exercises/${exerciseId}/variants`);
    const data = res.ok ? await res.json() : [];
    const list: Variant[] = Array.isArray(data) ? data : [];
    setVariants(list);
    setSelected((prev) =>
      prev !== null && list.some((v) => v.id === prev) ? prev : list[0]?.id ?? null,
    );
  }, [exerciseId]);

  // Un compteur plutot qu'un appel direct : changer de version relance l'effet,
  // dont le nettoyage annule la reponse precedente. Sans ca, la reponse de la
  // version A pouvait arriver apres celle de B et l'ecraser.
  const [reloadToken, setReloadToken] = useState(0);
  const reloadWeights = useCallback(() => setReloadToken((n) => n + 1), []);

  useEffect(() => {
    if (hasVariants) loadVariants();
  }, [hasVariants, loadVariants]);

  useEffect(() => {
    // Tant qu'aucune version n'est choisie, il n'y a pas de paliers a montrer :
    // interroger l'API sans version renverrait ceux d'un autre bucket.
    if (hasVariants && selected === null) {
      setWeights([]);
      return;
    }

    let cancelled = false;
    (async () => {
      setWeights(null);
      const qs = hasVariants && selected !== null ? `?variantId=${selected}` : "";
      const res = await fetch(`/api/exercises/${exerciseId}/weights${qs}`);
      const data = res.ok ? await res.json() : [];
      if (!cancelled) setWeights(Array.isArray(data) ? data : []);
    })();
    return () => {
      cancelled = true;
    };
  }, [exerciseId, hasVariants, selected, reloadToken]);

  const toggleVariants = async (next: boolean) => {
    if (busy) return;
    setBusy(true);
    try {
      await fetch(`/api/exercises/${exerciseId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hasVariants: next }),
      });
      setHasVariants(next);
    } finally {
      setBusy(false);
    }
  };

  const addVariant = async () => {
    const name = variantInput.trim();
    if (!name || busy) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/exercises/${exerciseId}/variants`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const created = res.ok ? await res.json() : null;
      setVariantInput("");
      await loadVariants();
      if (created?.id) setSelected(created.id);
    } finally {
      setBusy(false);
    }
  };

  const renameVariant = async () => {
    const name = renameInput.trim();
    if (!name || selected === null || busy) return;
    setBusy(true);
    try {
      await fetch(`/api/exercises/${exerciseId}/variants`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ variantId: selected, name }),
      });
      setRenameInput("");
      await loadVariants();
    } finally {
      setBusy(false);
    }
  };

  const removeVariant = async (id: number) => {
    if (busy) return;
    setBusy(true);
    try {
      await fetch(`/api/exercises/${exerciseId}/variants?variantId=${id}`, {
        method: "DELETE",
      });
      await loadVariants();
    } finally {
      setBusy(false);
    }
  };

  const addWeight = async () => {
    const w = parseFloat(weightInput.replace(",", "."));
    if (!Number.isFinite(w) || w <= 0 || busy) return;
    setBusy(true);
    try {
      await fetch(`/api/exercises/${exerciseId}/weights`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          weightKg: w,
          variantId: hasVariants ? selected : null,
        }),
      });
      setWeightInput("");
      reloadWeights();
    } finally {
      setBusy(false);
    }
  };

  const removeWeight = async (w: number) => {
    if (busy) return;
    setBusy(true);
    try {
      const qs = hasVariants && selected !== null ? `&variantId=${selected}` : "";
      await fetch(`/api/exercises/${exerciseId}/weights?weightKg=${w}${qs}`, {
        method: "DELETE",
      });
      reloadWeights();
    } finally {
      setBusy(false);
    }
  };

  const needsVariant = hasVariants && selected === null;
  const selectedName = variants.find((v) => v.id === selected)?.name ?? null;

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="text-xs font-bold uppercase tracking-widest text-primary/60">
          Paliers de poids
        </CardTitle>
      </CardHeader>
      <CardContent>
        <button
          onClick={() => toggleVariants(!hasVariants)}
          disabled={busy}
          className={`mb-3 inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all active:scale-95 disabled:opacity-50 ${
            hasVariants
              ? "bg-primary/15 text-primary ring-1 ring-primary/40"
              : "bg-secondary/50 text-muted-foreground hover:bg-accent"
          }`}
        >
          <MapPin className="size-3.5" />
          Change selon la salle
        </button>

        {hasVariants && (
          <div className="mb-4 rounded-xl border border-primary/20 bg-secondary/30 p-3">
            <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-primary/50">
              Versions
            </p>
            {variants.length > 0 && (
              <div className="mb-2 flex flex-wrap gap-1.5">
                {variants.map((v) => (
                  <span
                    key={v.id}
                    className={`inline-flex items-center gap-1 rounded-lg text-xs font-bold transition-all ${
                      selected === v.id
                        ? "bg-gradient-orange-intense text-black shadow-lg"
                        : "bg-secondary/50 text-muted-foreground"
                    }`}
                  >
                    <button
                      onClick={() => setSelected(v.id)}
                      disabled={busy}
                      className="py-1.5 pl-3 disabled:opacity-50"
                    >
                      {v.name}
                    </button>
                    <button
                      onClick={() => removeVariant(v.id)}
                      disabled={busy}
                      title={`Supprimer ${v.name}`}
                      className="py-1.5 pr-2.5 disabled:opacity-50"
                    >
                      <X className="size-3 opacity-60" />
                    </button>
                  </span>
                ))}
              </div>
            )}
            <form
              className="mb-2 flex gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                addVariant();
              }}
            >
              <Input
                placeholder="Nom de la salle"
                value={variantInput}
                onChange={(e) => setVariantInput(e.target.value)}
                className="h-10 bg-secondary/50 text-sm font-medium"
              />
              <Button
                type="submit"
                disabled={!variantInput.trim() || busy}
                className="h-10 shrink-0 bg-gradient-orange-intense px-3 font-bold text-black"
              >
                <Plus className="size-4" strokeWidth={3} />
              </Button>
            </form>

            {/* Renommer la version selectionnee : le nouveau nom s'applique
                partout, y compris sur les seances deja faites. */}
            {selectedName && (
              <form
                className="flex gap-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  renameVariant();
                }}
              >
                <Input
                  placeholder={`Renommer « ${selectedName} »`}
                  value={renameInput}
                  onChange={(e) => setRenameInput(e.target.value)}
                  className="h-10 bg-secondary/50 text-sm font-medium"
                />
                <Button
                  type="submit"
                  variant="outline"
                  disabled={!renameInput.trim() || busy}
                  className="h-10 shrink-0 px-3 text-xs font-bold"
                >
                  <Pencil className="size-3.5" />
                </Button>
              </form>
            )}
          </div>
        )}

        <p className="mb-3 text-xs text-muted-foreground">
          {hasVariants
            ? "Les plaques de cette version. Chaque salle garde ses propres paliers, ses records et sa dernière perf."
            : "Les plaques de cette machine. Elles servent à proposer le poids de la série suivante, et se complètent toutes seules au fil de tes séances."}
        </p>

        {needsVariant ? (
          <p className="text-sm text-muted-foreground">
            Ajoute une salle pour commencer à ranger tes paliers.
          </p>
        ) : (
          <>
            {weights === null ? (
              <div className="flex justify-center py-4">
                <Loader2 className="size-5 animate-spin text-primary/60" />
              </div>
            ) : weights.length === 0 ? (
              <p className="mb-3 text-sm text-muted-foreground">
                Aucun palier pour l&apos;instant.
              </p>
            ) : (
              <div className="mb-3 flex flex-wrap gap-1.5">
                {weights.map((w) => (
                  <button
                    key={w}
                    onClick={() => removeWeight(w)}
                    disabled={busy}
                    title={`Retirer ${w} kg`}
                    className="group inline-flex items-center gap-1.5 rounded-lg bg-secondary/50 px-3 py-1.5 text-xs font-bold transition-all hover:bg-accent active:scale-95 disabled:opacity-50"
                  >
                    {w} kg
                    <X className="size-3 text-muted-foreground group-hover:text-primary" />
                  </button>
                ))}
              </div>
            )}

            <form
              className="flex gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                addWeight();
              }}
            >
              <Input
                inputMode="decimal"
                placeholder="Ajouter un palier (kg)"
                value={weightInput}
                onChange={(e) => setWeightInput(e.target.value)}
                className="h-11 bg-secondary/50 font-medium"
              />
              <Button
                type="submit"
                disabled={!weightInput.trim() || busy}
                className="h-11 shrink-0 bg-gradient-orange-intense px-4 font-bold text-black"
              >
                <Plus className="size-4" strokeWidth={3} />
              </Button>
            </form>
          </>
        )}
      </CardContent>
    </Card>
  );
}
