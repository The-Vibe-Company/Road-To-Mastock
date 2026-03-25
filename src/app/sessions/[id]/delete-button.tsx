"use client";

import { useRouter } from "next/navigation";

export function DeleteSessionButton({ sessionId }: { sessionId: number }) {
  const router = useRouter();

  const handleDelete = async () => {
    if (!confirm("Supprimer cette séance ?")) return;
    await fetch(`/api/sessions/${sessionId}`, { method: "DELETE" });
    router.push("/");
  };

  return (
    <button
      onClick={handleDelete}
      className="w-full rounded-xl border border-red-200 py-3 text-sm font-medium text-red-500 active:bg-red-50"
    >
      Supprimer cette séance
    </button>
  );
}
