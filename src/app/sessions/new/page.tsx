"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

export default function NewSession() {
  const router = useRouter();
  const [error, setError] = useState(false);
  const startedRef = useRef(false);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    fetch("/api/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    })
      .then((r) => r.json())
      .then((s) => router.replace(`/sessions/${s.id}`))
      .catch(() => setError(true));
  }, [router]);

  if (error) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <p className="text-sm text-destructive">Erreur lors de la création</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh items-center justify-center">
      <p className="text-sm text-primary/60">Création de la séance...</p>
    </div>
  );
}
