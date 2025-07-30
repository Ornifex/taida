import React, { useState, useRef, useEffect } from "react";
import { Button } from "./ui/button";
import { Progress } from "./ui/progress";
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  SkipBack,
  SkipForward,
  ArrowLeft,
  Subtitles,
  MonitorPlay,
} from "lucide-react";
import { usePlayerStore } from "../store/playerStore";

declare global {
  interface Window {
    webtorrent: {
      onStreamUrl: (callback: (url: string) => void) => void;
    };
  }
}

interface PlayerViewProps {
  onBackToWatch: () => void;
}

export function PlayerView({ onBackToWatch }: PlayerViewProps) {
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(100);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [subtitlesEnabled, setSubtitlesEnabled] = useState(true);
  const [streamUrl, setStreamUrl] = useState<string | null>(null);
  const [subtitleUrl, setSubtitleUrl] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const setTimestamp = usePlayerStore((s) => s.setTimestamp);
  const timestamp = usePlayerStore((s) => s.timestamp);
  const currentEpisode = usePlayerStore((s) => s.currentEpisode);

  useEffect(() => {
    if (currentEpisode?.infoHash) {
      // Set loading state
      setStreamUrl(null);

      console.log(`Requesting stream for: ${currentEpisode.infoHash}`);
      window.ipcRenderer
        .invoke("webtorrent:stream", currentEpisode.infoHash)
        .then((url: string) => {
          console.log(`Received stream URL: ${url}`);
          setStreamUrl(url);
        })
        .catch((err) => {
          console.error("Error requesting stream:", err);
        });

      const subtitleUrl =
        process.env.NODE_ENV === "development"
          ? `http://localhost:5173/subtitles/${currentEpisode.infoHash}.vtt`
          : `http://localhost:3001/subtitles/${currentEpisode.infoHash}.vtt`;
      setSubtitleUrl(subtitleUrl);

      const handleStreamUrl = (url: string) => {
        setStreamUrl(url);
        if (videoRef.current && url) {
          videoRef.current.src = url;
          videoRef.current.play().catch(() => {});
        }
      };
      console.log(subtitleUrl);

      window.webtorrent.onStreamUrl(handleStreamUrl);

      return () => {
        /*if (window.ipcRenderer && window.ipcRenderer.off) {
            window.ipcRenderer.off('stream-url', handleStreamUrl);
          }*/
        if (videoRef.current) {
          videoRef.current.pause();
          videoRef.current.removeAttribute("src");
          videoRef.current.load();
        }
      };
    } else {
      setStreamUrl(null);
    }
  }, [currentEpisode?.infoHash]);

  useEffect(() => {
    if (videoRef.current) {
      const tracks = videoRef.current.textTracks;
      for (let i = 0; i < tracks.length; i++) {
        tracks[i].mode = subtitlesEnabled ? "showing" : "hidden";
      }
    }
  }, [subtitleUrl, subtitlesEnabled]);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = isMuted;
      videoRef.current.volume = volume / 100;
      videoRef.current.playbackRate = playbackSpeed;
    }
  }, [isMuted, volume, playbackSpeed]);

  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    controlsTimeoutRef.current = setTimeout(() => {
      setShowControls(false);
    }, 3000);
  };

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
    if (videoRef.current) {
      if (!isPlaying) {
        videoRef.current.play().catch(() => {});
      } else {
        videoRef.current.pause();
      }
    }
  };

  const handleSeek = (value: number) => {
    if (videoRef.current && duration > 0) {
      const newTime = (value / 100) * duration;
      videoRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const handleVolumeChange = (value: number) => {
    setVolume(value);
    setIsMuted(value === 0);
    if (videoRef.current) {
      videoRef.current.volume = value / 100;
      videoRef.current.muted = value === 0;
    }
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
    }
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
    if (videoRef.current) {
      if (!isFullscreen) {
        videoRef.current.requestFullscreen?.();
      } else {
        document.exitFullscreen?.();
      }
    }
  };

  const skipTime = (seconds: number) => {
    if (videoRef.current && duration > 0) {
      const newTime = Math.max(
        0,
        Math.min(videoRef.current.currentTime + seconds, duration)
      );
      videoRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, "0")}:${secs
        .toString()
        .padStart(2, "0")}`;
    }
    return `${minutes}:${secs.toString().padStart(2, "0")}`;
  };

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const onLoadedMetadata = () => {
      setDuration(video.duration);
    };
    const onTimeUpdate = () => {
      setCurrentTime(video.currentTime);
      setTimestamp(video.currentTime);
    };
    video.addEventListener("loadedmetadata", onLoadedMetadata);
    video.addEventListener("timeupdate", onTimeUpdate);

    return () => {
      video.removeEventListener("loadedmetadata", onLoadedMetadata);
      video.removeEventListener("timeupdate", onTimeUpdate);
    };
  }, [streamUrl]);

  useEffect(() => {
    if (videoRef.current && timestamp > 0) {
      videoRef.current.currentTime = timestamp;
    }
  }, [streamUrl]);

  if (!currentEpisode?.infoHash) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <MonitorPlay className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-medium mb-2">No Episode Selected</h2>
          <p className="text-muted-foreground mb-4">
            Select an episode from your watchlist to start playing
          </p>
          <Button onClick={onBackToWatch}>Go to Watch List</Button>
        </div>
      </div>
    );
  }

  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div
      className="relative bg-black text-white h-full w-full"
      onMouseMove={handleMouseMove}
    >
      <div className="relative w-full h-full flex items-center justify-center">
        <video
          ref={videoRef}
          controls={false}
          className="w-full h-full object-contain"
          onClick={handlePlayPause}
          onContextMenu={(e) => {
            e.preventDefault();
            toggleFullscreen();
          }}
        >
          {streamUrl && <source src={streamUrl} type="video/x-matroska" />}
          {subtitleUrl && (
            <track src={subtitleUrl} kind="subtitles" label="English" default />
          )}
          Your browser does not support the video tag.
        </video>

        <div
          className={`absolute top-0 left-0 right-0 bg-gradient-to-b from-black/70 to-transparent p-4 transition-opacity duration-300 ${
            showControls ? "opacity-100" : "opacity-0"
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={onBackToWatch}
                className="text-white hover:bold"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <div>
                <h3 className="font-medium">{currentEpisode?.number}</h3>
                <p className="text-sm text-gray-300">
                  Episode {currentEpisode?.number}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleFullscreen}
                className="text-white hover:bg-white/20"
              >
                <Maximize className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        <div
          className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4 transition-opacity duration-300 ${
            showControls ? "opacity-100" : "opacity-0"
          }`}
        >
          <div className="mb-4">
            <Progress
              value={progressPercentage}
              className="h-2 cursor-pointer bg-white/20"
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const percentage = (x / rect.width) * 100;
                handleSeek(percentage);
              }}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => skipTime(-10)}
                  className="text-white hover:bg-white/20"
                >
                  <SkipBack className="h-5 w-5" />
                </Button>
                <Button
                  variant="ghost"
                  size="lg"
                  onClick={handlePlayPause}
                  className="text-white hover:bg-white/20"
                >
                  {isPlaying ? (
                    <Pause className="h-6 w-6" />
                  ) : (
                    <Play className="h-6 w-6" />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => skipTime(10)}
                  className="text-white hover:bg-white/20"
                >
                  <SkipForward className="h-5 w-5" />
                </Button>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleMute}
                  className="text-white hover:bg-white/20"
                >
                  {isMuted || volume === 0 ? (
                    <VolumeX className="h-4 w-4" />
                  ) : (
                    <Volume2 className="h-4 w-4" />
                  )}
                </Button>
                <div className="w-20">
                  <Progress
                    value={isMuted ? 0 : volume}
                    className="h-1 cursor-pointer bg-white/20"
                    onClick={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect();
                      const x = e.clientX - rect.left;
                      const percentage = (x / rect.width) * 100;
                      handleVolumeChange(percentage);
                    }}
                  />
                </div>
              </div>

              <span className="text-sm text-gray-300">
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSubtitlesEnabled(!subtitlesEnabled)}
                className={`text-white hover:bg-white/20 ${
                  subtitlesEnabled ? "bg-white/20" : ""
                }`}
              >
                <Subtitles className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-white hover:bg-white/20"
              ></Button>
              <select
                value={playbackSpeed}
                onChange={(e) => setPlaybackSpeed(Number(e.target.value))}
                className="bg-transparent text-white text-sm border border-white/20 rounded px-2 py-1"
              >
                <option value={0.5} className="text-black">
                  0.5x
                </option>
                <option value={1} className="text-black">
                  1x
                </option>
                <option value={1.5} className="text-black">
                  1.5x
                </option>
                <option value={2} className="text-black">
                  2x
                </option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
