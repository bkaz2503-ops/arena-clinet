import { HostControlClient } from "@/components/arena/host/control-client";

type HostEventPageProps = {
  params: Promise<{ id: string }>;
};

export default async function HostEventPage({ params }: HostEventPageProps) {
  const { id } = await params;

  return <HostControlClient eventId={id} />;
}
