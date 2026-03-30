"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

export function LogoutButton() {
  const router = useRouter();

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleLogout}
      className="size-10 rounded-xl text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
    >
      <LogOut className="size-5" />
    </Button>
  );
}
