"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { LogOut, Loader2 } from "lucide-react";

export function LogoutButton() {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  const handleLogout = async () => {
    if (pending) return;
    setPending(true);
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleLogout}
      disabled={pending}
      className="size-10 rounded-xl text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
    >
      {pending ? <Loader2 className="size-5 animate-spin" /> : <LogOut className="size-5" />}
    </Button>
  );
}
