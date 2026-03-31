"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, ChevronRight, Plus, Pencil, Check, X } from "lucide-react";

interface Exercise {
  id: number;
  name: string;
  muscleGroup: string | null;
}

const MUSCLE_GROUPS = [
  "Pectoraux", "Dos", "Épaules", "Biceps", "Triceps",
  "Quadriceps", "Ischio-jambiers", "Fessiers", "Mollets",
  "Abdominaux", "Cardio",
];

export default function ExerciseCatalog() {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [newMuscle, setNewMuscle] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");

  const refresh = useCallback(() => {
    fetch("/api/exercises")
      .then((r) => r.json())
      .then((data) => {
        setExercises(data);
        setLoading(false);
      });
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const handleCreate = async () => {
    if (!newName.trim() || creating) return;
    setCreating(true);
    await fetch("/api/exercises", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName.trim(), muscleGroup: newMuscle }),
    });
    setCreating(false);
    setNewName("");
    setNewMuscle(null);
    setShowCreate(false);
    refresh();
  };

  const handleRename = async (id: number) => {
    if (!editName.trim()) return;
    await fetch(`/api/exercises/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: editName.trim() }),
    });
    setEditingId(null);
    setEditName("");
    refresh();
  };

  const grouped: Record<string, Exercise[]> = {};
  for (const ex of exercises) {
    const key = ex.muscleGroup || "Autre";
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(ex);
  }

  if (loading) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <div className="size-8 animate-spin rounded-full border-2 border-primary/20 border-t-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-dvh px-4 pb-8 pt-6">
      <Link
        href="/"
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
      >
        <ArrowLeft className="size-4" />
        Retour
      </Link>

      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-black tracking-tight">Catalogue</h1>
        <Button
          onClick={() => setShowCreate(!showCreate)}
          className="h-10 bg-gradient-orange-intense px-4 font-bold text-black"
        >
          <Plus className="size-4" strokeWidth={3} />
          Créer
        </Button>
      </div>

      {showCreate && (
        <div className="mb-6 rounded-2xl border border-primary/20 bg-secondary/30 p-4">
          <p className="mb-3 text-sm font-bold">Nouvel exercice</p>
          <Input
            placeholder="Nom de l'exercice"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            className="mb-3 h-11 bg-secondary/50 font-medium"
            autoFocus
          />
          <p className="mb-2 text-xs font-bold text-muted-foreground">Muscle ciblé</p>
          <div className="mb-4 flex flex-wrap gap-1.5">
            {MUSCLE_GROUPS.map((mg) => (
              <button
                key={mg}
                onClick={() => setNewMuscle(newMuscle === mg ? null : mg)}
                className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all active:scale-95 ${
                  newMuscle === mg
                    ? "bg-gradient-orange-intense text-black shadow-lg"
                    : "bg-secondary/50 text-muted-foreground hover:bg-accent"
                }`}
              >
                {mg}
              </button>
            ))}
          </div>
          <Button
            onClick={handleCreate}
            disabled={!newName.trim() || creating}
            className="h-11 w-full bg-gradient-orange-intense font-bold text-black"
          >
            {creating ? "Création..." : "Ajouter"}
          </Button>
        </div>
      )}

      {Object.keys(grouped).length === 0 ? (
        <p className="py-16 text-center text-sm text-muted-foreground">
          Aucun exercice. Clique sur Créer pour commencer.
        </p>
      ) : (
        <div className="space-y-4">
          {Object.entries(grouped).map(([muscleGroup, exs]) => (
            <Card key={muscleGroup}>
              <CardHeader>
                <CardTitle className="text-xs font-bold uppercase tracking-widest text-primary/60">
                  {muscleGroup}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-0.5">
                {exs.map((ex) => (
                  <div key={ex.id} className="flex items-center gap-1">
                    {editingId === ex.id ? (
                      <form
                        className="flex flex-1 items-center gap-2 rounded-xl px-3 py-2"
                        onSubmit={(e) => { e.preventDefault(); handleRename(ex.id); }}
                      >
                        <Input
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="h-9 flex-1 bg-secondary/50 font-bold"
                          autoFocus
                        />
                        <button
                          type="submit"
                          className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors hover:bg-primary/20"
                        >
                          <Check className="size-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingId(null)}
                          className="flex size-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent"
                        >
                          <X className="size-4" />
                        </button>
                      </form>
                    ) : (
                      <>
                        <Link
                          href={`/exercises/${ex.id}`}
                          className="flex flex-1 items-center justify-between rounded-xl px-3 py-3 transition-all hover:bg-accent active:scale-[0.97]"
                        >
                          <p className="font-bold">{ex.name}</p>
                          <ChevronRight className="size-4 text-primary/40" />
                        </Link>
                        <button
                          onClick={() => { setEditingId(ex.id); setEditName(ex.name); }}
                          className="flex size-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-primary"
                        >
                          <Pencil className="size-3.5" />
                        </button>
                      </>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
