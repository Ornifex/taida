import { dayNames } from "@/constants";
import type { Anime } from "@/types";

export const getTimeUntilAiring = (airDate: string) => {
  const now = new Date();
  const air = new Date(airDate);
  const diff = air.getTime() - now.getTime();

  if (diff <= 0) return "Aired";

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

  if (days > 0) return `${days}d ${hours}h`;
  return `${hours}h`;
};

export const formatAiringAt = (airingAt?: number) => {
  if (!airingAt) return "";
  const date = new Date(airingAt * 1000);
  return date.toLocaleString("en-GB", {
    weekday: "long",
    hour: "2-digit",
    minute: "2-digit",
    day: "numeric",
    month: "short",
    timeZoneName: "short",
  });
};

export const getCurrentYear = () => {
  return new Date().getFullYear();
};

export const getCurrentSeason = () => {
  const month = new Date().getMonth();
  if (month >= 0 && month <= 2) return "WINTER";
  if (month >= 3 && month <= 5) return "SPRING";
  if (month >= 6 && month <= 8) return "SUMMER";
  return "FALL";
};

export const getDay = (anime: Anime) => {
  const airingAt = anime.nextAiringEpisode?.airingAt;
  if (!airingAt) return "unknown";
  const date = new Date(airingAt * 1000);
  const day = date.toLocaleString(undefined, { weekday: "long" }).toLowerCase();
  return day;
};

export const getCurrentDay = () => {
  return dayNames[new Date().getDay()];
};

export const getFilteredAndSortedAnime = (
  animeList: Anime[],
  sortBy: string,
  selectedYear: string,
  selectedSeason: string,
  selectedWeekday: string,
  searchTerm: string
) => {
  return animeList
    .sort((a, b) => {
      switch (sortBy) {
        case "alphabetical":
          return (a.name ?? "").localeCompare(b.name ?? "");
        case "rating":
          return (b.averageScore ?? 0) - (a.averageScore ?? 0);
        case "popularity":
          return (b.popularity ?? 0) - (a.popularity ?? 0);
        case "episodes":
          return (b.episodes ?? 0) - (a.episodes ?? 0);
        case "air-date":
        default:
          return (
            (a.nextAiringEpisode?.timeUntilAiring ?? 0) -
            (b.nextAiringEpisode?.timeUntilAiring ?? 0)
          );
      }
    })
    .filter((anime) => {
      const day = getDay(anime);
      const seasonMatch =
        selectedSeason === "ALL" || anime.season === selectedSeason;
      const yearMatch =
        selectedYear === "all" || String(anime.seasonYear) === selectedYear;
      const dayMatch = selectedWeekday === "all" || day === selectedWeekday;
      const searchMatch =
        searchTerm === "" ||
        anime.name?.toLowerCase().includes(searchTerm.toLowerCase());

      return seasonMatch && yearMatch && dayMatch && searchMatch;
    });
};

export const getTodaysShows = (animeList: Anime[]) => {
  const todayName = dayNames[new Date().getDay()];
  return animeList.filter(
    (anime) =>
      anime.status === "RELEASING" &&
      getDay(anime) === todayName &&
      anime.watching
  );
};
