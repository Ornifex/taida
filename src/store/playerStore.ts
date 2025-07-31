import { Anime, Episode } from "@/types/anime";
import { time } from "node:console";
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface PlayerState {
  currentEpisode: Episode | null;
  currentAnime: Anime | null;
  setCurrentEpisode: (episode: Episode | null, anime: Anime) => void;
  timestamp: number;
  setTimestamp: (time: number) => void;
}

export const usePlayerStore = create<PlayerState>()(
  persist(
    (set) => ({
      currentEpisode: null,
      currentAnime: null,
      setCurrentEpisode: (episode, anime) => {
        set({ currentEpisode: episode, currentAnime: anime  });
      },
      timestamp: 0,
      setTimestamp: (time) => set({ timestamp: time }),
    }),
    {
      name: "player-storage",
    }
  )
);
