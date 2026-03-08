import React, {
  createContext,
  useContext,
  useMemo,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react";
import type { RoomSnapshot, TeamRoomSnapshot } from "@/lib/game/room-types";

interface SpecialModeContextType {
  roomCode: string | null;
  setRoomCode: Dispatch<SetStateAction<string | null>>;
  hostSnapshot: RoomSnapshot | null;
  setHostSnapshot: Dispatch<SetStateAction<RoomSnapshot | null>>;
  teamSnapshot: TeamRoomSnapshot | null;
  setTeamSnapshot: Dispatch<SetStateAction<TeamRoomSnapshot | null>>;
  pendingSuggestedPickId: string | null;
  setPendingSuggestedPickId: Dispatch<SetStateAction<string | null>>;
}

const SpecialModeContext = createContext<SpecialModeContextType | null>(null);

export function useSpecialMode() {
  const context = useContext(SpecialModeContext);
  if (!context) {
    throw new Error("useSpecialMode must be used within SpecialModeProvider");
  }
  return context;
}

export function SpecialModeProvider({ children }: { children: ReactNode }) {
  const [roomCode, setRoomCode] = useState<string | null>(null);
  const [hostSnapshot, setHostSnapshot] = useState<RoomSnapshot | null>(null);
  const [teamSnapshot, setTeamSnapshot] = useState<TeamRoomSnapshot | null>(null);
  const [pendingSuggestedPickId, setPendingSuggestedPickId] = useState<string | null>(null);

  const value = useMemo(
    () => ({
      roomCode,
      setRoomCode,
      hostSnapshot,
      setHostSnapshot,
      teamSnapshot,
      setTeamSnapshot,
      pendingSuggestedPickId,
      setPendingSuggestedPickId,
    }),
    [roomCode, hostSnapshot, teamSnapshot, pendingSuggestedPickId],
  );

  return <SpecialModeContext.Provider value={value}>{children}</SpecialModeContext.Provider>;
}
