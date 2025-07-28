import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Search, Eye, Download, MonitorPlay, ArrowRight } from "lucide-react";
import { Button } from "./ui/button";
import { usePlayerStore } from "@/store/playerStore";

interface LandingViewProps {
  onNavigate: (view: string) => void;
}

export function LandingView({ onNavigate }: LandingViewProps) {
  const currentEpisode = usePlayerStore((s) => s.currentEpisode);
  const features = [
    {
      id: "browse",
      title: "Browse Anime",
      description:
        "Anime are fetched from the AniList API. We use nyaapi to search for episodes up until the latest aired episode. Left-click to add a show to your watch list, right-click to remove.",
      icon: Search,
      color: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    },
    {
      id: "watch",
      title: "Watch List",
      description:
        "Shows your tracked anime and their episodes, as colour-coded boxes. Left-click to download an episode, if it has aired, and right-click a downloading or downloaded episode to start watching.",
      icon: Eye,
      color: "bg-green-500/10 text-green-400 border-green-500/20",
    },
    {
      id: "downloads",
      title: "Download Manager",
      description:
        "We use WebtTorrent as a torrent client to download and stream files in progress. Just shows files that are in the WebTorrent client and some stats.",
      icon: Download,
      color: "bg-purple-500/10 text-purple-400 border-purple-500/20",
    },
    {
      id: "player",
      title: "Video Player",
      description:
        "This view has a video player element that can play in progress downloads. Subtitles are only supported for finished downloads, since they need to be extracted.",
      icon: MonitorPlay,
      color: "bg-red-500/10 text-red-400 border-red-500/20",
    },
  ];

  return (
    <div className="flex-1 flex flex-col overflow-auto">
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-4xl w-full">
          {features.map((feature) => {
            const IconComponent = feature.icon;
            return (
              <Card
                key={feature.id}
                className="border-2 hover:border-primary/50 transition-colors"
              >
                <CardHeader className="pb-4">
                  <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-lg border ${feature.color}`}>
                      <IconComponent className="h-6 w-6" />
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-xl mb-2">
                        {feature.title}
                      </CardTitle>
                      <CardDescription className="text-muted-foreground leading-relaxed">
                        {feature.description}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <Button
                    onClick={() => onNavigate(feature.id)}
                    variant="outline"
                    className="w-full group"
                    disabled={feature.id === "player" && !currentEpisode}
                  >
                    {feature.id === "player" && !currentEpisode
                      ? "Available when episode selected"
                      : `Go to ${feature.title}`}
                    {(feature.id !== "player" || currentEpisode) && (
                      <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    )}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
