"use client";

import { use } from "react";
import { SessionEditor } from "@/components/session-editor";

export default function SessionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  return <SessionEditor sessionId={parseInt(id)} />;
}
