"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Dashboard } from "./dashboard";

export function FriendDashboard({
  friendUserId,
  friendName,
}: {
  friendUserId: number;
  friendName: string;
}) {
  return (
    <div className="flex min-h-dvh flex-col px-4 pb-12 pt-6">
      <div className="mb-6">
        <Link
          href="/friends"
          className="mb-3 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
        >
          <ArrowLeft className="size-4" />
          Retour
        </Link>
        <h1 className="text-2xl font-black tracking-tight">
          Stats de {friendName}
        </h1>
      </div>

      <Dashboard friendUserId={friendUserId} />
    </div>
  );
}
