"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

export function BackButton({
  fallback = "/",
  label = "Retour",
  className = "",
}: {
  fallback?: string;
  label?: string;
  className?: string;
}) {
  const router = useRouter();

  const handleClick = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.push(fallback);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`-ml-2 mb-4 inline-flex items-center gap-2 rounded-xl px-3 py-2.5 text-base font-bold text-muted-foreground transition-all hover:bg-accent hover:text-primary active:scale-95 ${className}`}
    >
      <ArrowLeft className="size-5" strokeWidth={2.5} />
      {label}
    </button>
  );
}
