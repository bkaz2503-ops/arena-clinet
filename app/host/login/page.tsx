import { redirect } from "next/navigation";

import { HostLoginClient } from "@/components/arena/host/login-client";
import { getHostSession } from "@/lib/auth";

export default async function HostLoginPage() {
  const session = await getHostSession();

  if (session) {
    redirect("/host/dashboard");
  }

  return <HostLoginClient />;
}
