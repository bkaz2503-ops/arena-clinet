import { LiveClient } from "@/components/arena/live/live-client";

type LivePageProps = {
  params: Promise<{ pin: string }>;
};

export default async function LivePage({ params }: LivePageProps) {
  const { pin } = await params;

  return <LiveClient pin={pin} />;
}
