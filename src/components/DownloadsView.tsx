import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Play, Pause, X, Download } from "lucide-react";
import { Torrent } from "../types/torrent";
import { useTorrentStore } from "@/store/torrentStore";

export function DownloadsView() {
  const [torrents, setTorrents] = useState<Torrent[]>([]);
  const _ = useTorrentStore((state) => state.torrents);
  const removeTorrent = useTorrentStore((state) => state.removeTorrent);

  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    async function fetchTorrents() {
      const data: Torrent[] = await window.ipcRenderer.invoke(
        "webtorrent:list"
      );
      setTorrents(
        data.map((torrent) => ({
          ...torrent,
          status: getTorrentStatus(torrent),
        }))
      );
    }
    fetchTorrents();

    intervalId = setInterval(fetchTorrents, 3000);
    return () => clearInterval(intervalId);
  }, []);

  function getTorrentStatus(torrent: Torrent): Torrent["status"] {
    if (!torrent.done && torrent.downloadspeed > 0) return "downloading";
    if (torrent.done && torrent.uploadspeed > 0) return "seeding";
    if (torrent.done && torrent.uploadspeed === 0) return "completed";
    return "paused";
  }

  const handlePauseResume = (infoHash: string) => {
    setTorrents((prev) =>
      prev.map((torrent) => {
        if (torrent.infoHash === infoHash) {
          const newStatus =
            torrent.status === "paused" ? getTorrentStatus(torrent) : "paused";
          return {
            ...torrent,
            status: newStatus,
            downloadspeed: newStatus === "paused" ? 0 : torrent.downloadspeed,
            uploadspeed: newStatus === "paused" ? 0 : torrent.uploadspeed,
          };
        }
        return torrent;
      })
    );
  };

  const handleRemove = async (infoHash: string) => {
    await window.ipcRenderer.invoke("webtorrent:remove", infoHash);
    removeTorrent(infoHash);
    setTorrents((prev) =>
      prev.filter((torrent) => torrent.infoHash !== infoHash)
    );
  };

  const getStatusInfo = (status: Torrent["status"]) => {
    switch (status) {
      case "downloading":
        return {
          color: "#3b82f6",
          bgColor: "bg-blue-500",
          text: "Downloading",
        };
      case "seeding":
        return {
          color: "#22c55e",
          bgColor: "bg-green-500",
          text: "Seeding",
        };
      case "paused":
        return {
          color: "#f97316",
          bgColor: "bg-orange-500",
          text: "Paused",
        };
      case "completed":
        return {
          color: "#a855f7",
          bgColor: "bg-purple-500",
          text: "Completed",
        };
      default:
        return {
          color: "#6b7280",
          bgColor: "bg-gray-500",
          text: "Unknown",
        };
    }
  };

  const totalDownloadSpeed = torrents
    .filter((t) => t.status === "downloading")
    .reduce((total, torrent) => total + (torrent.downloadspeed || 0), 0);

  const totalUploadSpeed = torrents.reduce(
    (total, torrent) => total + (torrent.uploadspeed || 0),
    0
  );

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-medium text-foreground mb-2">Downloads</h1>
        <div className="flex gap-6 text-sm text-muted-foreground">
          <span>
            Active: {torrents.filter((t) => t.status === "downloading").length}
          </span>
          <span>
            Total Down: {(totalDownloadSpeed / 1024 / 1024).toFixed(1)} MB/s
          </span>
          <span>
            Total Up: {(totalUploadSpeed / 1024 / 1024).toFixed(1)} MB/s
          </span>
        </div>
      </div>

      <div className="space-y-4">
        {torrents.map((torrent) => {
          const statusInfo = getStatusInfo(torrent.status);
          return (
            <Card key={torrent.infoHash}>
              <CardHeader className="">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-base font-medium pr-4 line-clamp-2">
                    {torrent.name}
                  </CardTitle>
                  <div className="flex gap-2 flex-shrink-0">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handlePauseResume(torrent.infoHash)}
                      className="gap-1"
                    >
                      {torrent.status === "paused" ? (
                        <Play className="h-4 w-4" />
                      ) : (
                        <Pause className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleRemove(torrent.infoHash)}
                      className="gap-1 text-destructive hover:text-destructive"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="relative h-6 bg-muted -mt-4 rounded-md overflow-hidden">
                  <div
                    className="h-full transition-all duration-300 ease-out"
                    style={{
                      width: `${torrent.progress * 100}%`,
                      backgroundColor: statusInfo.color,
                    }}
                  />
                  <div className="absolute inset-0 flex items-center justify-between px-3 text-sm font-medium">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{
                          backgroundColor: statusInfo.color,
                        }}
                      />
                      <span className="text-foreground drop-shadow-sm">
                        {statusInfo.text}
                      </span>
                      <span
                        className={`text-xs font-normal ${statusInfo.bgColor} text-white px-2 py-1 rounded-full`}
                      >
                        {(torrent.downloaded / 1024 / 1024).toFixed(2)} /{" "}
                        {(torrent?.files[0]?.length / 1024 / 1024).toFixed(2)}{" "}
                        MB
                      </span>
                    </div>
                    <span className="text-foreground drop-shadow-sm">
                      {Math.round(torrent.progress * 100)}%
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-x-6 gap-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Path:</span>
                    <span>{torrent.path + "\\"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Down:</span>
                    <span className="text-blue-400">
                      {(torrent.downloadspeed / 1024 / 1024).toFixed(2)} MB/s
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Up:</span>
                    <span className="text-green-400">
                      {(torrent.uploadspeed / 1024 / 1024).toFixed(2)} MB/s
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Peers:</span>
                    <span>{torrent.numPeers}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Ratio:</span>
                    <span>{torrent.ratio.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Time Left:</span>
                    <span>
                      {torrent.timeRemaining > 0
                        ? `${Math.ceil(torrent.timeRemaining / 1000)}s`
                        : torrent.done
                        ? "Done"
                        : "--"}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {torrents.length === 0 && (
        <div className="text-center py-12">
          <Download className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">No active downloads</h3>
          <p className="text-muted-foreground">
            Your torrents will appear here when you start downloading.
          </p>
        </div>
      )}
    </div>
  );
}
