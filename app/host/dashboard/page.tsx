import { redirect } from "next/navigation";

import { HostDashboardClient } from "@/components/arena/host/dashboard-client";
import { getHostSession } from "@/lib/auth";

export default async function HostDashboardPage() {
  const session = await getHostSession();

  if (!session) {
    redirect("/host/login");
  }

  return <HostDashboardClient />;
}
