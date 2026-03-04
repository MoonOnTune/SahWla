import { RevealPage } from "@/components/game/reveal-page";

type Props = {
  params: Promise<{ movie: string }>;
};

export default async function RevealMoviePage({ params }: Props) {
  const resolved = await params;
  let movieName = resolved.movie ?? "";
  try {
    movieName = decodeURIComponent(movieName);
  } catch {
    movieName = resolved.movie ?? "";
  }
  return <RevealPage movieName={movieName} />;
}
