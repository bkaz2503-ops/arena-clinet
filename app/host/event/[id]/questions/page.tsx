import { redirect } from "next/navigation";

import { HostQuestionsClient } from "@/components/arena/host/questions-client";
import { getHostSession } from "@/lib/auth";
import { db } from "@/lib/db";

type HostQuestionsPageProps = {
  params: Promise<{ id: string }>;
};

export default async function HostQuestionsPage({
  params
}: HostQuestionsPageProps) {
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

  return <HostQuestionsClient eventId={id} />;
}
