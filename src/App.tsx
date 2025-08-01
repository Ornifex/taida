import React, { useState, useEffect } from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from "./components/ui/sidebar";
import {
  Search,
  Eye,
  Download,
  Settings,
  MonitorPlay,
  Home,
} from "lucide-react";
import { BrowseView } from "./components/BrowseView";
import { WatchView } from "./components/WatchView";
import { DownloadsView } from "./components/DownloadsView";
import { SettingsView } from "./components/SettingsView";
import { PlayerView } from "./components/PlayerView";
import { useTorrentStore } from "./store/torrentStore";
import { MetaTorrent } from "./store/torrentStore";
import { Episode, Torrent } from "./types";
import { Separator } from "./components/ui/separator";
import { LandingView } from "./components/LandingView";
import { useAnimeStore } from "./store/animeStore";
import { TitleBar } from "./components/TitleBar";

type View =
  | "browse"
  | "watch"
  | "downloads"
  | "settings"
  | "player"
  | "landing";

export default function App() {
  const [currentView, setCurrentView] = useState<View>("landing");
  const [hideTitleBar, setHideTitleBar] = useState(false);
  const { animeList, updateAnime } = useAnimeStore();
  const metaTorrents = useTorrentStore((state) => state.torrents);
  const addTorrent = useTorrentStore((state) => state.addTorrent);

  useEffect(() => {
    async function fetchTorrents() {
      try {
        const data: Torrent[] = await window.ipcRenderer.invoke(
          "webtorrent:list"
        );
        metaTorrents.forEach(async (torrent: MetaTorrent) => {
          if (!data.some((t) => t.infoHash === torrent.infoHash)) {
            await window.ipcRenderer.invoke(
              "webtorrent:add",
              torrent.magnetURI
            );
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
      } catch (error) {
        console.error("Error fetching torrents:", error);
      }
    }
    fetchTorrents();
    console.log("🔄 Restoring torrents from WebTorrent client...");
  }, []);

  useEffect(() => {
    const checkForNewEpisodes = async () => {
      const watchlistAnime = animeList.filter((anime) => anime.watching);
      if (watchlistAnime.length === 0) return;

      for (const anime of watchlistAnime) {
        try {
          const currentMaxEpisode = Math.max(
            ...(anime.episodeList?.map((ep) => ep.number) || [0])
          );

          const expectedEpisodes =
            anime.nextAiringEpisode?.episode || anime.episodes || 12;

          if (expectedEpisodes > currentMaxEpisode) {
            const updatedEpisodeList = await window.ipcRenderer.invoke(
              "fetch-torrents-for-anime",
              anime
            );

            const newEpisodes = updatedEpisodeList.filter(
              (ep) => ep.number > currentMaxEpisode && ep.link && ep.infoHash
            );

            if (newEpisodes.length > 0) {
              updateAnime(anime.id, { episodeList: updatedEpisodeList });
            }
          }

          await new Promise((resolve) => setTimeout(resolve, 3000));
        } catch (error) {
          console.error(
            `Failed to check new episodes for ${anime.name}:`,
            error
          );
        }
      }
    };

    // Delay initial check by 30 seconds
    const timeoutId = setTimeout(checkForNewEpisodes, 30000);

    const intervalId = setInterval(checkForNewEpisodes, 2 * 60 * 60 * 1000);

    return () => {
      clearTimeout(timeoutId);
      clearInterval(intervalId);
    };
  }, [animeList, updateAnime]);

  const sidebarItems = [
    { id: "landing" as View, label: "Home", icon: Home },
    { id: "browse" as View, label: "Browse", icon: Search },
    { id: "watch" as View, label: "Watch", icon: Eye },
    { id: "downloads" as View, label: "Downloads", icon: Download },
    { id: "player" as View, label: "Player", icon: MonitorPlay },
    { id: "settings" as View, label: "Settings", icon: Settings },
  ];

  //when user hits ctrl+b setHideTitleBar to true
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.key === "b") {
        event.preventDefault();
        setHideTitleBar((prev) => !prev);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const renderView = () => {
    switch (currentView) {
      case "landing":
        return <LandingView onNavigate={setCurrentView} />;
      case "browse":
        return <BrowseView />;
      case "watch":
        return (
          <WatchView
            onPlayEpisode={() => {
              setCurrentView("player");
            }}
          />
        );
      case "downloads":
        return <DownloadsView />;
      case "settings":
        return <SettingsView />;
      case "player":
        return <PlayerView onBackToWatch={() => setCurrentView("watch")} />;
      default:
        return <BrowseView />;
    }
  };

  return (
    <div className="h-screen w-full bg-background dark flex flex-col overflow-hidden">
      <div className="flex-shrink-0">
        {!hideTitleBar && <TitleBar
          icon={sidebarItems.find(item => item.id === currentView)?.icon}
        />}
      </div>

      <SidebarProvider>
        <div className="flex flex-1 min-h-0 h-[calc(100vh-32px)] scrollbar-hide">
          <Sidebar className="border-r mt-8 border-border flex-shrink-0 overflow-y-auto">
            <SidebarHeader className="p-6 -mt-4">
              <h2 className="text-lg font-medium">Navigation</h2>
            </SidebarHeader>
            <SidebarContent>
              <SidebarMenu className="px-3 ">
                {sidebarItems.map((item) => (
                  <SidebarMenuItem key={item.id}>
                    <SidebarMenuButton
                      onClick={() => setCurrentView(item.id)}
                      isActive={currentView === item.id}
                      className="w-full justify-start gap-3 px-3 py-3"
                    >
                      <item.icon className="h-5 w-5" />
                      <span>{item.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarContent>
          </Sidebar>

          <main className="flex-1 overflow-auto scrollbar-hide">
            {renderView()}
          </main>
        </div>
      </SidebarProvider>
    </div>
  );
}
