import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Anime } from "../types/anime";
import type { Episode } from "../types/anime";

interface AnimeStore {
  animeList: Anime[];
  addAnime: (anime: Anime) => void;
  removeAnime: (id: number) => void;
  updateAnime: (id: number, changes: Partial<Anime>) => void;
  mergeAnimeList: (fetched: Anime[]) => void;
}

function mergeEpisodeLists(fetched: Episode[], existing: Episode[]): Episode[] {
  return fetched
    .map((fetchedEp) => {
      const existingEp = existing.find((ep) => ep.number === fetchedEp.number);
      return existingEp
        ? { ...fetchedEp, infoHash: existingEp.infoHash ?? fetchedEp.infoHash }
        : fetchedEp;
    })
    .concat(
      existing.filter((ep) => !fetched.some((f) => f.number === ep.number))
    );
}

function mergeAnimeLists(fetched: Anime[], existing: Anime[]): Anime[] {
  const existingMap = new Map(existing.map((a) => [a.id, a]));
  return fetched
    .map((anime) => {
      const prev = existingMap.get(anime.id);
      if (!prev) return anime;
      return {
        ...anime,
        ...prev,
        nextAiringEpisode:
          anime.nextAiringEpisode && prev.nextAiringEpisode
            ? anime.nextAiringEpisode.episode !== undefined &&
              prev.nextAiringEpisode.episode !== undefined &&
              anime.nextAiringEpisode.episode > prev.nextAiringEpisode.episode
              ? anime.nextAiringEpisode
              : prev.nextAiringEpisode
            : anime.nextAiringEpisode ?? prev.nextAiringEpisode,
        watching:
          typeof prev.watching === "boolean" ? prev.watching : anime.watching,
        episodeList: mergeEpisodeLists(
          anime.episodeList ?? [],
          prev.episodeList ?? []
        ),
      };
    })
    .concat(existing.filter((a) => !fetched.some((f) => f.id === a.id)));
}

export const useAnimeStore = create<AnimeStore>()(
  persist(
    (set) => ({
      animeList: [],
      setAnimeList: (anime: Anime[]) => set({ animeList: anime }),
      addAnime: (anime) =>
        set((state) => ({ animeList: [...state.animeList, anime] })),
      removeAnime: (id) =>
        set((state) => ({
          animeList: state.animeList.filter((anime) => anime.id !== Number(id)),
        })),
      updateAnime: (id, changes) =>
        set((state) => ({
          animeList: state.animeList.map((anime) =>
            anime.id === id ? { ...anime, ...changes } : anime
          ),
        })),
      mergeAnimeList: (fetched) =>
        set((state) => ({
          animeList: mergeAnimeLists(fetched, state.animeList),
        })),
    }),
    {
      name: "anime-storage",
    }
  )
);
