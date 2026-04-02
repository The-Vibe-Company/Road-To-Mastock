import { getAuthUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { FriendsPage } from "@/components/friends-page";

export default async function Friends() {
  const auth = await getAuthUser();
  if (!auth) redirect("/login");

  return <FriendsPage />;
}
