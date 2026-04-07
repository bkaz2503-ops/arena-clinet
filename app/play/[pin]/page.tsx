import { PlayClient } from "@/components/arena/play/play-client";

type PlayPageProps = {
  params: Promise<{ pin: string }>;
};

export default async function PlayPage({ params }: PlayPageProps) {
  const { pin } = await params;

  return <PlayClient pin={pin} />;
}
