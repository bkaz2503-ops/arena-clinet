import { JoinClient } from "@/components/arena/join/join-client";

type JoinPageProps = {
  searchParams: Promise<{ pin?: string }>;
};

export default async function JoinPage({ searchParams }: JoinPageProps) {
  const params = await searchParams;

  return <JoinClient initialPin={params.pin ?? ""} />;
}
