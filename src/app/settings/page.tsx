import { getAuthUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { SettingsPage } from "@/components/settings-page";

export default async function Settings() {
  const auth = await getAuthUser();
  if (!auth) redirect("/login");

  return <SettingsPage />;
}
