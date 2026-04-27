"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Plus, Loader2 } from "lucide-react";

export function NewSessionButton() {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  return (
    <Button
      size="lg"
      disabled={pending}
      onClick={() => {
        if (pending) return;
        setPending(true);
        router.push("/sessions/new");
      }}
      className="h-14 rounded-2xl bg-gradient-orange-intense px-8 text-base font-bold tracking-tight text-black shadow-2xl glow-orange disabled:opacity-100"
    >
      {pending ? (
        <Loader2 className="size-5 animate-spin" strokeWidth={3} />
      ) : (
        <Plus className="size-5" strokeWidth={3} />
      )}
      {pending ? "Création..." : "Nouvelle séance"}
    </Button>
  );
}
