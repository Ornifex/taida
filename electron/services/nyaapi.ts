import { si } from "nyaapi";
import fetch from "node-fetch";
import stringSimilarity from "string-similarity";
import { Episode } from "@/types/anime";
import { Anime } from "@/types/anime";

function normalize(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^\w\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function cleanTorrentName(torrentName: string): string {
  const split720p = torrentName.split("720p");
  if (split720p.length > 1) {
    return split720p[0] + "720p";
  }

  const split1080p = torrentName.split("1080p");
  if (split1080p.length > 1) {
    return split1080p[0] + "1080p";
  }

  return torrentName;
}

async function getCurrentSeasonAnime(page: number = 1): Promise<Anime[]> {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  let season: string;
  if (month >= 3 && month <= 5) season = "SPRING";
  else if (month >= 6 && month <= 8) season = "SUMMER";
  else if (month >= 9 && month <= 11) season = "FALL";
  else season = "WINTER";

  // should be able to pass these as variables but yeah
  const query = `
        query ($seasonYear: Int, $season: MediaSeason, $page: Int) {
            Page(page: $page, perPage: 50) {
                media(seasonYear: $seasonYear, season: $season, type: ANIME, sort: POPULARITY_DESC) {
                    id
                    idMal
                    title { romaji english native }
                    format
                    status
                    description
                    startDate { year month day }
                    endDate { year month day }
                    season
                    seasonYear
                    episodes
                    duration            
                    trailer { id site thumbnail }        
                    coverImage { large }
                    bannerImage
                    genres
                    synonyms
                    averageScore
                    popularity
                    studios { edges { node { name } } }
                    nextAiringEpisode { airingAt timeUntilAiring episode }
                    siteUrl
                }
            }
        }
    `;

  const variables = {
    season: season,
    seasonYear: year,
    page: page,
  };

  const response = await fetch("https://graphql.anilist.co", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      query,
      variables,
    }),
  });

  const json = (await response.json()) as {
    data?: { Page: { media: Anime[] } };
    errors?: any[];
  };

  if (json.errors) {
    console.error("AniList API error:", json.errors);
    return [];
  }

  return json.data?.Page.media || [];
}

export async function getAnime(): Promise<any[]> {
  const animeList = await getCurrentSeasonAnime();

  return animeList.map((anime) => ({
    ...anime,
    name: anime.title.romaji,
    episodeList: [],
  }));
}

export async function fetchTorrentsForAnime(
  anime: any
): Promise<{ number: number; link: string; infoHash?: string }[]> {
  const searchTerms = [
    anime.title.romaji,
    anime.title.english,
    anime.title.native,
  ].filter(Boolean);

  const maxEpisode = anime.nextAiringEpisode?.episode || anime.episodes || 12;
  const episodeRange = Math.min(maxEpisode, 24);
  const episodeList: { number: number; link: string; infoHash?: string }[] = [];

  for (let episode = 1; episode <= episodeRange; episode++) {
    if (anime.episodeList?.some((ep: Episode) => ep.number === episode)) {
      continue;
    }
    let foundEpisode = false;

    for (const searchTerm of searchTerms) {
      if (!searchTerm || foundEpisode) break;

      try {
        // should make this user definable but yeah
        const searchQueries = [
          `${searchTerm} ${episode.toString().padStart(2, "0")} 720p`,
          `${searchTerm} ${episode} 720p`,
          `${searchTerm} ${episode.toString().padStart(2, "0")}`,
          `${searchTerm} ${episode}`,
        ];

        for (const query of searchQueries) {
          if (foundEpisode) break;

          const results = await si.search(query, 1, {
            category: "1_2",
            sort: "seeders",
            order: "desc",
          });

          if (results && results.length > 0) {
            for (const torrent of results) {
              const cleanedTorrentName = cleanTorrentName(torrent.name);
              const normalizedTorrentName = normalize(cleanedTorrentName);
              const normalizedSearchTerm = normalize(searchTerm);

              const titleMatch =
                stringSimilarity.compareTwoStrings(
                  normalizedTorrentName,
                  normalizedSearchTerm
                ) > 0.3;
              const episodeMatch =
                normalizedTorrentName.includes(
                  episode.toString().padStart(2, "0")
                ) || normalizedTorrentName.includes(`${episode}`);
              const qualityMatch =
                normalizedTorrentName.includes("720p") ||
                normalizedTorrentName.includes("1080p");

              if (titleMatch && episodeMatch && qualityMatch) {
                episodeList.push({
                  number: episode,
                  link: torrent.magnet,
                  infoHash: torrent.hash,
                });
                foundEpisode = true;
                break;
              }
            }
          }

          await new Promise((resolve) => setTimeout(resolve, 500));
        }
      } catch (error: any) {
        console.error(
          `Error searching for ${searchTerm} episode ${episode}:`,
          error.message
        );
      }
    }
  }
  return episodeList;
}
