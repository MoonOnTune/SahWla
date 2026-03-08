import { TeamControllerView } from "@/components/game/figma/TeamControllerView";

export default async function TeamPlayPage({
  searchParams,
}: {
  searchParams: Promise<{ room?: string; team?: string }>;
}) {
  const params = await searchParams;
  const room = params.room?.trim().toUpperCase() ?? "";
  const team = params.team === "B" ? "B" : "A";

  return <TeamControllerView initialRoomCode={room} initialTeam={team} />;
}
