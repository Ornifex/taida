export interface TorrentFile {
  name: string;
  length: number;
}

export interface Torrent {
  infoHash: string;
  name: string;
  progress: number;
  magnetURI: string;
  timeRemaining: number;
  ratio: number;
  numPeers: number;
  path: string;
  done: boolean;
  downloaded: number;
  uploaded: number;
  downloadspeed: number;
  uploadspeed: number;
  files: TorrentFile[];
  status?: "downloading" | "seeding" | "paused" | "completed";
}
