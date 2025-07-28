import { Episode } from "@/types/anime";
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface PlayerState {
  currentEpisode: Episode | null;
  setCurrentEpisode: (episode: Episode | null) => void;
  timestamp: number;
  setTimestamp: (time: number) => void;
}

export const usePlayerStore = create<PlayerState>()(
  persist(
    (set) => ({
      currentEpisode: null,
      setCurrentEpisode: (episode) => set({ currentEpisode: episode }),
      timestamp: 0,
      setTimestamp: (time) => set({ timestamp: time }),
    }),
    {
      name: "player-storage",
    }
  )
);
