"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Shield } from "@/components/icons";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dashboard } from "./dashboard";
import { BackButton } from "./back-button";
import { useTalents } from "./talents-provider";
import { RARITY_COLORS, type Rarity } from "@/lib/rarities";

interface FriendGuardian {
  exerciseName: string;
  mascot: { name: string; rarity: Rarity; imageUrl: string | null };
}

export function FriendDashboard({
  friendUserId,
  friendName,
}: {
  friendUserId: number;
  friendName: string;
}) {
  // Le Lien (Manaphy) : voir le plateau de Gardiens de l'ami.
  const { has } = useTalents();
  const [guardians, setGuardians] = useState<FriendGuardian[]>([]);

  useEffect(() => {
    if (!has("lien")) return;
    fetch(`/api/friends/${friendUserId}/guardians`)
      .then((r) => (r.ok ? r.json() : []))
      .then((d) => {
        if (Array.isArray(d)) setGuardians(d);
      })
      .catch(() => {});
  }, [friendUserId, has]);

  return (
    <div className="flex min-h-dvh flex-col px-4 pb-12 pt-6">
      <div className="mb-6">
        <BackButton fallback="/friends" className="mb-3" />
        <h1 className="text-2xl font-black tracking-tight">
          Stats de {friendName}
        </h1>
      </div>

      {has("lien") && guardians.length > 0 && (
        <Card className="card-gradient-border mb-4">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-primary/60">
              <Shield className="size-4" />
              Ses gardiens ({guardians.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1.5">
              {guardians.map((g, i) => (
                <div key={i} className="flex items-center gap-2.5">
                  <div className="relative size-8 shrink-0">
                    {g.mascot.imageUrl && (
                      <Image src={g.mascot.imageUrl} alt="" fill unoptimized className="object-contain" />
                    )}
                  </div>
                  <p className="min-w-0 flex-1 truncate text-sm">
                    <span className={`font-black ${RARITY_COLORS[g.mascot.rarity]?.text ?? ""}`}>
                      {g.mascot.name}
                    </span>
                    <span className="text-muted-foreground"> garde </span>
                    <span className="font-bold">{g.exerciseName}</span>
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Dashboard friendUserId={friendUserId} />
    </div>
  );
}
