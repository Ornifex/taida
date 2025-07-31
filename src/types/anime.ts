export interface Episode {
  number: number;
  link: string;
  infoHash?: string;
  watching?: "unwatched" | "watching" | "watched";
}

export interface Anime {
  id: number;
  name?: string;
  idMal?: number;
  title: {
    romaji?: string;
    english?: string;
    native?: string;
  };
  format?: string;
  status?: string;
  description?: string;
  startDate?: {
    year?: number;
    month?: number;
    day?: number;
  };
  endDate?: {
    year?: number;
    month?: number;
    day?: number;
  };
  season?: string;
  seasonYear?: number;
  episodes?: number;
  duration?: number;
  trailer?: {
    id?: string;
    site?: string;
    thumbnail?: string;
  };
  coverImage?: {
    large?: string;
  };
  bannerImage?: string;
  genres?: string[];
  synonyms?: string[];
  averageScore?: number;
  popularity?: number;
  studios?: {
    edges?: Array<{
      isMain?: boolean;
      node?: {
        id: number;
        name: string;
      };
    }>;
  };
  nextAiringEpisode?: {
    airingAt?: number;
    timeUntilAiring?: number;
    episode?: number;
  };
  siteUrl?: string;

  episodeList?: Episode[];
  watching?: boolean;
}
