import { redirect } from "next/navigation";

import { HostRegisterClient } from "@/components/arena/host/register-client";
import { getHostSession } from "@/lib/auth";

export default async function HostRegisterPage() {
  const session = await getHostSession();

  if (session) {
    redirect("/host/dashboard");
  }

  return <HostRegisterClient />;
}
