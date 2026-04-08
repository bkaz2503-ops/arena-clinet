import { redirect } from "next/navigation";

import { HostControlClient } from "@/components/arena/host/control-client";
import { getHostSession } from "@/lib/auth";
import { db } from "@/lib/db";

type HostEventPageProps = {
  params: Promise<{ id: string }>;
};

export default async function HostEventPage({ params }: HostEventPageProps) {
  const session = await getHostSession();

  if (!session) {
    redirect("/host/login");
  }

  const { id } = await params;
  const ownedEvent = await db.event.findFirst({
    where: {
      id,
      created_by: session.sub
    },
    select: {
      id: true
    }
  });

  if (!ownedEvent) {
    redirect("/host/dashboard");
  }

  return <HostControlClient eventId={id} />;
}
