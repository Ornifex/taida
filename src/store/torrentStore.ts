import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface MetaTorrent {
  infoHash: string;
  magnetURI: string;
  name?: string;
}

export interface TorrentStore {
  torrents: MetaTorrent[];
  addTorrent: (torrent: MetaTorrent) => void;
  removeTorrent: (infoHash: string) => void;
  clearTorrents: () => void;
}

export const useTorrentStore = create<TorrentStore>()(
  persist<TorrentStore>(
    (set) => ({
      torrents: [] as MetaTorrent[],
      addTorrent: (torrent: MetaTorrent) =>
        set((state) => ({
          torrents: [
            ...state.torrents.filter((t) => t.infoHash !== torrent.infoHash),
            torrent,
          ],
        })),
      removeTorrent: (infoHash: string) =>
        set((state) => ({
          torrents: state.torrents.filter((t) => t.infoHash !== infoHash),
        })),
      clearTorrents: () => set({ torrents: [] }),
    }),
    {
      name: "torrent-storage",
    }
  )
);
