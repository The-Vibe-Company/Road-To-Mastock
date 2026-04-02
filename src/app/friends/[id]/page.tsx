import { getAuthUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { FriendDashboard } from "@/components/friend-dashboard";

export default async function FriendStats({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const auth = await getAuthUser();
  if (!auth) redirect("/login");

  const { id } = await params;
  const friendUserId = parseInt(id);

  const [friend] = await db
    .select({ id: users.id, name: users.name })
    .from(users)
    .where(eq(users.id, friendUserId));

  if (!friend) redirect("/friends");

  return <FriendDashboard friendUserId={friend.id} friendName={friend.name} />;
}
