import React, { useState } from "react";
import { Card, CardContent, CardHeader } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Badge } from "./ui/badge";
import { Progress } from "./ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import {
  Play,
  Search,
  Clock,
  Calendar,
  Download,
  Eye,
  EyeOff,
  TrendingUp,
  Magnet,
  SlidersHorizontal,
} from "lucide-react";
import { ImageWithFallback } from "./ui/ImageWithFallback";
import { useAnimeStore } from "@/store/animeStore";
import type { Anime } from "@/types";
import { useEffect } from "react";
import type { Torrent } from "@/types/torrent";
import type { Episode } from "@/types";
import { usePlayerStore } from "@/store";
import { MetaTorrent, useTorrentStore } from "@/store/torrentStore";
import { X } from "lucide-react";
import { AnimeFilters } from "./shared/AnimeFilters";

import {
  getCurrentYear,
  getTimeUntilAiring,
  getTodaysShows,
  getCurrentSeason,
  getCurrentDay,
  getFilteredAndSortedAnime,
} from "@/utils.ts/utils";

import { years, dayNames, weekdays, seasons, sortOptions } from "@/constants";

interface WatchViewProps {
  onPlayEpisode: (episode: Episode) => void;
}

export function WatchView({ onPlayEpisode }: WatchViewProps) {
  const animeList = useAnimeStore((state) => state.animeList);
  const setCurrentEpisode = usePlayerStore((state) => state.setCurrentEpisode);
  const setTimestamp = usePlayerStore((s) => s.setTimestamp);
  const updateAnime = useAnimeStore((state) => state.updateAnime);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterBy, setFilterBy] = useState("all");
  const [sortBy, setSortBy] = useState(sortOptions[0].value);
  const [compactView, setCompactView] = useState(false);
  const [torrents, setTorrents] = useState<Torrent[]>([]);
  const [selectedYear, setSelectedYear] = useState<string>(
    getCurrentYear().toString()
  );
  const [selectedSeason, setSelectedSeason] = useState<string>("ALL");
  const [selectedWeekday, setSelectedWeekday] = useState<string>("all");
  const currentYear = getCurrentYear();

  const metaTorrents = useTorrentStore((state) => state.torrents);
  const addTorrent = useTorrentStore((state) => state.addTorrent);

  const filteredAndSortedWatchlist = getFilteredAndSortedAnime(
    animeList,
    sortBy,
    selectedYear,
    selectedSeason,
    selectedWeekday,
    searchTerm
  ).filter((anime) => anime.watching);

  async function fetchTorrents() {
    const data: Torrent[] = await window.ipcRenderer.invoke("webtorrent:list");
    metaTorrents.forEach(async (torrent: MetaTorrent) => {
      if (!data.some((t) => t.infoHash === torrent.infoHash)) {
        await window.ipcRenderer.invoke("webtorrent:add", torrent.magnetURI);
      }
    });
    data.forEach((torrent: Torrent) => {
      if (data.some((t) => t.infoHash === torrent.infoHash)) return;
      addTorrent({
        infoHash: torrent.infoHash,
        magnetURI: torrent.magnetURI,
        name: torrent.name,
      });
    });

    setTorrents(
      data.map((torrent) => ({
        ...torrent,
      }))
    );
  }

  useEffect(() => {
    let intervalId: NodeJS.Timeout;
    fetchTorrents();

    intervalId = setInterval(fetchTorrents, 500);
    return () => clearInterval(intervalId);
  }, []);

  const getEpisodeColor = (episode: Episode) => {
    const torrent = torrents.find((t) => t.infoHash === episode.infoHash);
    if (!torrent) {
      return "bg-orange-500 hover:bg-orange-600 border-orange-400";
    }
    if (torrent.done) {
      return "bg-green-500 hover:bg-green-600 border-green-400";
    }
    if (!torrent.done) {
      return "bg-yellow-500 hover:bg-yellow-600 border-yellow-400";
    }
    return "bg-gray-500 border-gray-400";
  };

  const handleEpisodeClick = async (anime: Anime, episode: Episode) => {
    try {
      const alreadyAdded = torrents.some(
        (t) => t.infoHash === episode.infoHash
      );
      let result;
      if (!alreadyAdded) {
        result = await window.ipcRenderer.invoke(
          "webtorrent:add",
          episode.link
        );
        addTorrent({
          infoHash: result.infoHash,
          magnetURI: episode.link,
          name: `${anime.name} - ${episode.number}`,
        });
      } else {
        result = torrents.find((t) => t.infoHash === episode.infoHash);
      }

      updateAnime(anime.id, {
        episodeList: (
          animeList.find((a) => a.id === anime.id)?.episodeList ?? []
        ).map((ep) =>
          ep.number === episode.number
            ? { ...ep, infoHash: result.infoHash }
            : ep
        ),
      });
      await fetchTorrents();
    } catch (error) {
      console.error("Failed to add torrent:", error);
    }
  };

  const handleRightClick = async (
    anime: Anime,
    episode: Episode,
    e: React.MouseEvent
  ) => {
    e.preventDefault();
    if (!torrents.some((t) => t.infoHash === episode.infoHash)) return;

    const streamUrl = await window.ipcRenderer.invoke(
      "webtorrent:stream",
      episode.infoHash
    );

    setTimestamp(0);
    setCurrentEpisode(episode);
    onPlayEpisode(episode);
  };

  const todaysShows = getTodaysShows(animeList).filter(
    (anime) => anime.watching
  );

  return (
    <div className="p-6 space-y-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <h1 className="text-2xl font-medium text-foreground">Watch</h1>
            <p className="text-muted-foreground">
              {filteredAndSortedWatchlist.filter((a) => a.watching).length}{" "}
              shows •{" "}
              {
                filteredAndSortedWatchlist.filter(
                  (a) => a.status === "RELEASING" && a.watching
                ).length
              }{" "}
              ongoing
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCompactView(!compactView)}
              className="gap-2 text-foreground"
            >
              {compactView ? (
                <Eye className="h-4 w-4" />
              ) : (
                <EyeOff className="h-4 w-4" />
              )}
              <span className="text-foreground">
                {compactView ? "Detailed" : "Compact"}
              </span>
            </Button>
          </div>
        </div>

        <AnimeFilters
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          selectedYear={selectedYear}
          setSelectedYear={setSelectedYear}
          selectedSeason={selectedSeason}
          setSelectedSeason={setSelectedSeason}
          sortBy={sortBy}
          setSortBy={setSortBy}
          selectedWeekday={selectedWeekday}
          setSelectedWeekday={setSelectedWeekday}
        />

        <div className="flex gap-6 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded-sm"></div>
            <span className="text-muted-foreground">Downloaded</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-yellow-500 rounded-sm"></div>
            <span className="text-muted-foreground">Downloading</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-orange-500 rounded-sm"></div>
            <span className="text-muted-foreground">Not Downloaded</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-500 rounded-sm"></div>
            <span className="text-muted-foreground">Not Aired</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-gray-500 rounded-sm"></div>
            <span className="text-muted-foreground">No Magnet</span>
          </div>
        </div>
      </div>

      {todaysShows.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-medium text-foreground">
              Airing Today
            </h2>
            <Badge variant="secondary" className="ml-2">
              {todaysShows.length} shows
            </Badge>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {todaysShows.map((anime) => (
              <div key={anime.id} className="flex-shrink-0 w-32">
                <div className="relative group cursor-pointer overflow-hidden">
                  <ImageWithFallback
                    src={
                      anime.bannerImage
                        ? anime.bannerImage
                        : anime.coverImage?.large
                    }
                    alt={anime.name}
                    className="w-32 h-18 object-cover rounded border-2 border-primary/20 group-hover:border-primary/60 transition-colors"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent rounded flex items-end">
                    <div className="p-2 text-white truncate ">
                      <p className="text-xs font-medium truncate">
                        {anime.name}
                      </p>
                      <p className="text-xs opacity-80">
                        {anime.nextAiringEpisode?.airingAt
                          ? getTimeUntilAiring(
                              new Date(
                                anime.nextAiringEpisode.airingAt * 1000
                              ).toString()
                            )
                          : "N/A"}
                      </p>
                      <p className="text-xs opacity-80">
                        {anime.nextAiringEpisode?.episode
                          ? ` Episode ${anime.nextAiringEpisode.episode}`
                          : ""}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div
        className={`grid gap-4 ${
          compactView
            ? "grid-cols-1 lg:grid-cols-2"
            : "grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3"
        }`}
      >
        {filteredAndSortedWatchlist.map((anime) => {
          return (
            <Card
              key={anime.id}
              className="overflow-hidden flex flex-col bg-card border-border"
            >
              <CardHeader className="pb-3 min-h-[140px]">
                <div className="flex gap-3 h-full">
                  <div className="flex-shrink-0">
                    <ImageWithFallback
                      src={anime.coverImage?.large}
                      alt={anime.name}
                      className="w-16 h-22 object-cover rounded"
                    />
                  </div>

                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1 min-w-0 pr-2">
                          <h3 className="font-medium text-card-foreground truncate">
                            {anime.name}
                          </h3>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                            <span className="text-muted-foreground truncate">
                              {anime.studios?.edges?.[0]?.node?.name ?? "N/A"}
                            </span>
                            <span className="text-muted-foreground">•</span>
                            <span className="text-muted-foreground">
                              {anime.seasonYear}
                            </span>
                            <span className="text-muted-foreground">•</span>
                            <span className="text-muted-foreground">
                              ★{" "}
                              {anime.averageScore !== undefined
                                ? anime.averageScore / 10
                                : "N/A"}
                            </span>
                            <span className="text-muted-foreground">•</span>
                            <TrendingUp className="inline h-4 w-4 text-white-500" />
                            <span className="text-muted-foreground">
                              {anime.popularity}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={async () => {
                              const episodeList =
                                await window.ipcRenderer.invoke(
                                  "fetch-torrents-for-anime",
                                  anime
                                );
                              updateAnime(anime.id, {
                                watching: true,
                                episodeList: episodeList,
                              });
                            }}
                            className="gap-1 text-muted-foreground hover:text-muted-foreground"
                            title="Check for new magnet links"
                          >
                            <Magnet className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              for (const ep of anime.episodeList ?? []) {
                                if (ep.infoHash) {
                                  handleEpisodeClick(anime, ep);
                                }
                              }
                            }}
                            className="gap-1 text-muted-foreground hover:text-muted-foreground"
                            title="Download all"
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              anime.watching = false;
                              updateAnime(anime.id, { watching: false });
                            }}
                            className="gap-1 text-destructive hover:text-destructive"
                            title="Remove from Watchlist"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      <div className="space-y-1 mb-3">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">
                            Progress
                          </span>
                          <span className="text-card-foreground">
                            {typeof anime.nextAiringEpisode?.episode ===
                            "number"
                              ? anime.nextAiringEpisode.episode - 1
                              : 0}
                            /{anime.episodes}
                          </span>
                        </div>
                        <Progress
                          value={Math.round(
                            ((anime.nextAiringEpisode?.episode ?? 0) /
                              (anime.episodes ?? 1)) *
                              100
                          )}
                          className="h-2"
                        />
                      </div>
                    </div>

                    <div className="h-12 flex flex-col justify-end">
                      {anime.status === "RELEASING" &&
                        anime.nextAiringEpisode?.airingAt && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                            <Clock className="h-3 w-3" />
                            <span className="text-muted-foreground">
                              Next episode {anime.nextAiringEpisode?.episode} in{" "}
                              {getTimeUntilAiring(
                                new Date(
                                  anime.nextAiringEpisode?.airingAt * 1000
                                ).toISOString()
                              )}
                            </span>
                          </div>
                        )}

                      {true && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          <span className="text-muted-foreground">
                            Last aired {new Date().toLocaleDateString()}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-3 flex-1 -mt-10 flex flex-col">
                <div className="space-y-2 flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-card-foreground">
                      Episodes
                    </span>
                  </div>

                  <div className="grid grid-cols-13 gap-1">
                    {(() => {
                      const totalEpisodes = anime.episodes ?? 0;
                      const episodeNumbers =
                        anime.episodeList?.map((ep) => ep.number) ?? [];
                      const minTracked =
                        episodeNumbers.length > 0
                          ? Math.min(...episodeNumbers)
                          : 1;
                      const maxTracked =
                        episodeNumbers.length > 0
                          ? Math.max(...episodeNumbers)
                          : 0;

                      return Array.from({ length: totalEpisodes }).map(
                        (_, idx) => {
                          const epNum = idx + 1;
                          const trackedEpisode = anime.episodeList?.find(
                            (ep) => ep.number === epNum
                          );

                          if (trackedEpisode) {
                            return (
                              <div
                                key={epNum}
                                className={`aspect-square rounded-sm cursor-pointer transition-all border ${getEpisodeColor(
                                  trackedEpisode
                                )} flex items-center justify-center text-white text-xs font-medium`}
                                onClick={() =>
                                  handleEpisodeClick(anime, trackedEpisode)
                                }
                                onContextMenu={(e) =>
                                  handleRightClick(anime, trackedEpisode, e)
                                }
                              >
                                {epNum}
                              </div>
                            );
                          }

                          if (epNum < minTracked) {
                            return (
                              <div
                                key={epNum}
                                className="aspect-square rounded-sm bg-gray-500 border-gray-400 flex items-center justify-center text-white text-xs"
                                title="Aired, not tracked"
                              >
                                {epNum}
                              </div>
                            );
                          }

                          if (epNum > maxTracked) {
                            return (
                              <div
                                key={epNum}
                                className="aspect-square rounded-sm bg-red-500 border-red-400 flex items-center justify-center text-white text-xs"
                                title="Not aired"
                              >
                                {epNum}
                              </div>
                            );
                          }

                          return (
                            <div
                              key={epNum}
                              className="aspect-square rounded-sm bg-muted flex items-center justify-center text-muted-foreground text-xs border border-border"
                              title="Episode not tracked"
                            >
                              {epNum}
                            </div>
                          );
                        }
                      );
                    })()}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredAndSortedWatchlist.length === 0 && (
        <div className="text-center py-12">
          <Eye className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2 text-foreground">
            No anime found. It's over.
          </h3>
          <p className="text-muted-foreground">
            Try adjusting your search or filters.
          </p>
        </div>
      )}
    </div>
  );
}
