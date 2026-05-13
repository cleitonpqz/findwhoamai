import MatchView from "@/components/MatchView";

interface MatchPageProps {
  params: Promise<{ matchId: string }>;
}

export default async function MatchPage({ params }: MatchPageProps) {
  const { matchId } = await params;

  return (
    <main className="min-h-screen py-8">
      <MatchView matchId={matchId} />
    </main>
  );
}
