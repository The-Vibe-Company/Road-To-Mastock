"use client";

import { Dashboard } from "./dashboard";
import { BackButton } from "./back-button";

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
        <BackButton fallback="/friends" className="mb-3" />
        <h1 className="text-2xl font-black tracking-tight">
          Stats de {friendName}
        </h1>
      </div>

      <Dashboard friendUserId={friendUserId} />
    </div>
  );
}
