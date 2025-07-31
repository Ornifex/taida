import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import {
  Search,
  SlidersHorizontal,
  Star,
  Clock,
  Calendar,
  Grid3X3,
  List,
  Eye,
} from "lucide-react";
import { ImageWithFallback } from "./ui/ImageWithFallback";

import { Anime, Episode } from "@/types";

import {
  getTimeUntilAiring,
  formatAiringAt,
  getDay,
  getCurrentDay,
  getCurrentSeason,
  getCurrentYear,
  getFilteredAndSortedAnime,
  getTodaysShows,
} from "@/utils.ts/utils";

import { years, dayNames, weekdays, seasons, sortOptions } from "@/constants";

import { useAnimeStore } from "@/store/animeStore";
import { AnimeFilters } from "./shared/AnimeFilters";

export function BrowseView() {
  const animeList = useAnimeStore((state) => state.animeList);
  const mergeAnimeList = useAnimeStore((state) => state.mergeAnimeList);
  const updateAnime = useAnimeStore((state) => state.updateAnime);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedYear, setSelectedYear] = useState(getCurrentYear().toString());
  const [selectedSeason, setSelectedSeason] = useState("ALL");
  const [selectedWeekday, setSelectedWeekday] = useState(getCurrentDay());
  const [sortBy, setSortBy] = useState("air-date");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const currentYear = getCurrentYear();

  const todaysShows = getTodaysShows(animeList);

  useEffect(() => {
    const fetchAnime = async () => {
      const data = await window.ipcRenderer.invoke("get-anime-data");
      mergeAnimeList(data);
    };

    if (animeList.length === 0) {
      fetchAnime();
    } else {
      const timeout = setTimeout(fetchAnime, 30000);
      return () => clearTimeout(timeout);
    }
  }, [animeList.length, mergeAnimeList]);

  const getStatusBadge = (status: Anime["status"]) => {
    const variants = {
      releasing: {
        variant: "default" as const,
        label: "Airing",
      },
      finished: {
        variant: "secondary" as const,
        label: "Completed",
      },
      not_yet_released: {
        variant: "destructive" as const,
        label: "Upcoming",
      },
    };

    const normalizedStatus =
      typeof status === "string" ? status.toLowerCase() : "Error";
    return (
      variants[normalizedStatus as keyof typeof variants] || variants.upcoming
    );
  };

  const filteredAndSortedAnime = getFilteredAndSortedAnime(
    animeList,
    sortBy,
    selectedYear,
    selectedSeason,
    selectedWeekday,
    searchTerm
  );

  const handleLeftClick = async (anime: Anime) => {
    try {
      updateAnime(anime.id, {
        watching: true,
        episodeList: [],
      });

      window.ipcRenderer
        .invoke("fetch-torrents-for-anime", anime)
        .then((episodeList: Episode[]) => {
          updateAnime(anime.id, {
            episodeList: episodeList,
          });
        })
        .catch((error) => {
          console.error(`Failed to fetch torrents for ${anime.name}:`, error);
        });
    } catch (error) {
      console.error("Failed to add to watchlist:", error);
    }
  };

  const handleRightClick = (e: React.MouseEvent, id: number) => {
    e.preventDefault();
    updateAnime(id, { watching: false });
  };

  return (
    <div className="p-6 space-y-6 w-full">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-medium text-foreground">Browse</h1>
            <p className="text-muted-foreground">
              Discover and track seasonal anime •{" "}
              {filteredAndSortedAnime.length} shows found
              {todaysShows.length > 0 && (
                <span className="ml-2 text-primary">
                  • {todaysShows.length} airing today
                </span>
              )}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant={viewMode === "grid" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("grid")}
              className="gap-2"
            >
              <Grid3X3 className="h-4 w-4" />
              Grid
            </Button>
            <Button
              variant={viewMode === "list" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("list")}
              className="gap-2"
              disabled
            >
              <List className="h-4 w-4" />
              List
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

        <div
          className={`grid gap-4
            viewMode === "grid"
              ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4"
              : "space-y-3"
          }
              `}
        >
          {filteredAndSortedAnime.map((anime) => {
            const statusBadge = getStatusBadge(anime.status);
            const isToday = todaysShows.some((show) => show.id === anime.id);

            return (
              <Card
                className={`cursor-pointer transition-all hover:shadow-lg group overflow-hidden ${
                  anime.watching ? "ring-2 ring-primary/50" : ""
                } ${
                  isToday ? "ring-2 ring-yellow-500/30 bg-yellow-500/5" : ""
                }`}
                onClick={() => handleLeftClick(anime)}
                onContextMenu={(e) => handleRightClick(e, anime.id)}
              >
                <CardHeader className="p-0 relative">
                  <div className="relative overflow-hidden">
                    <ImageWithFallback
                      src={anime.coverImage?.large || ""}
                      alt={anime.name}
                      className="w-full h-56 object-cover duration-300 transition-transform group-hover:scale-105"
                    />

                    <div className="absolute top-2 left-2">
                      {anime.watching && (
                        <Badge className="bg-primary/90 text-primary-foreground shadow-md">
                          In Watchlist
                        </Badge>
                      )}
                    </div>

                    <div className="absolute top-2 right-2">
                      <Badge
                        variant={statusBadge.variant}
                        className="shadow-md"
                      >
                        {statusBadge.label}
                      </Badge>
                    </div>

                    {isToday && (
                      <div className="absolute top-2 left-1/2 transform -translate-x-1/2">
                        <Badge className="bg-yellow-500 text-black shadow-md">
                          Today
                        </Badge>
                      </div>
                    )}

                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent p-3">
                      <div className="flex items-end justify-between">
                        <div className="text-white">
                          <div className="flex drop-shadow items-center gap-1 text-sm font-medium mb-1">
                            <Calendar className="h-3 w-3 drop-shadow-sm" />
                            <span className="drop-shadow-md">
                              {formatAiringAt(
                                anime.nextAiringEpisode?.airingAt
                              )}
                            </span>
                          </div>
                          {anime.status === "RELEASING" && (
                            <div className="text-xs opacity-90">
                              {anime.studios?.edges?.[0]?.node?.name ?? "N/A"}
                            </div>
                          )}
                        </div>

                        <div className="text-right text-white">
                          <div className="flex items-center gap-1 text-sm font-medium">
                            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                            <span>
                              {typeof anime.averageScore === "number"
                                ? anime.averageScore / 10
                                : "N/A"}
                            </span>
                          </div>
                          {anime.status === "RELEASING" && (
                            <div className="text-xs opacity-95">
                              {typeof anime.nextAiringEpisode?.episode ===
                              "number"
                                ? anime.nextAiringEpisode.episode - 1
                                : "?"}{" "}
                              / {anime.episodes || "?"}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="p-4 -mt-10 space-y-3">
                  <div>
                    <h3 className="font-medium text-foreground line-clamp-1 mb-2">
                      {anime.name}
                    </h3>
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                      <span dangerouslySetInnerHTML={{ __html: anime.description || "" }} />
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-1">
                    {anime.genres &&
                      anime.genres.slice(0, 3).map((genre) => (
                        <Badge
                          key={anime.id + genre}
                          variant="outline"
                          className="text-xs px-2 py-0"
                        >
                          {genre}
                        </Badge>
                      ))}
                    {anime.genres && anime.genres.length > 3 && (
                      <Badge variant="outline" className="text-xs px-2 py-0">
                        +{anime.genres.length - 3}
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {filteredAndSortedAnime.length === 0 && (
          <div className="text-center grid py-12">
            <Eye className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2 text-foreground">
              No anime found
            </h3>
            <p className="text-muted-foreground">
              Try adjusting your search or filters.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
