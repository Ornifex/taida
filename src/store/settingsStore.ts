import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Settings } from "../types/settings";

interface SettingsStore {
  settings: Settings;
  setSettings: (settings: Settings) => void;
}

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      settings: {
        downloadPath: "C:\\Users\\perso\\AppData\\Local\\Temp\\webtorrent",
        subtitlePath: "userData/subtitles",
        maxDownloadSpeed: "0",
        maxUploadSpeed: "1000",
        maxActiveTorrents: "5",
        preferredGroup: "[SubsPlease]",
        autoStart: true,
        darkMode: true,
        notifications: true,
        videoQuality: "720p",
        subtitle: true,
        subtitleLanguage: "en",
        autoAddNewTorrents: true,
      },
      setSettings: (settings: Settings) => set({ settings }),
    }),
    {
      name: "settings-storage",
    }
  )
);

export function useSettings() {
  const { settings, setSettings } = useSettingsStore();
  return { settings, setSettings };
}
