import { redirect } from "next/navigation";

import { NewEventClient } from "@/components/arena/host/new-event-client";
import { getHostSession } from "@/lib/auth";

export default async function NewEventPage() {
  const session = await getHostSession();

  if (!session) {
    redirect("/host/login");
  }

  return <NewEventClient />;
}
