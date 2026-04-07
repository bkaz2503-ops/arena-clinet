import { HostQuestionsClient } from "@/components/arena/host/questions-client";

type HostQuestionsPageProps = {
  params: Promise<{ id: string }>;
};

export default async function HostQuestionsPage({
  params
}: HostQuestionsPageProps) {
  const { id } = await params;

  return <HostQuestionsClient eventId={id} />;
}
