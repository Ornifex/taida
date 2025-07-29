import { app, BrowserWindow, shell, ipcMain } from "electron";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import path from "node:path";
import os from "node:os";
import { update } from "./update";
import getCurrentSeasonAnimeWithTorrents, {
  getAnime,
} from "../services/nyaapi";
import WebTorrent from "webtorrent";
import http from "http";
import fs from "fs";
import parseTorrent from "parse-torrent";
import { spawn } from "node:child_process";

const client = new WebTorrent({
  maxConns: 55
});

const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// The built directory structure
//
// ├─┬ dist-electron
// │ ├─┬ main
// │ │ └── index.js    > Electron-Main
// │ └─┬ preload
// │   └── index.mjs   > Preload-Scripts
// ├─┬ dist
// │ └── index.html    > Electron-Renderer
//
process.env.APP_ROOT = path.join(__dirname, "../..");

export const MAIN_DIST = path.join(process.env.APP_ROOT, "dist-electron");
export const RENDERER_DIST = path.join(process.env.APP_ROOT, "dist");
export const VITE_DEV_SERVER_URL = process.env.VITE_DEV_SERVER_URL;

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL
  ? path.join(process.env.APP_ROOT, "public")
  : RENDERER_DIST;

// Disable GPU Acceleration for Windows 7
if (os.release().startsWith("6.1")) app.disableHardwareAcceleration();

// Set application name for Windows 10+ notifications
if (process.platform === "win32") app.setAppUserModelId(app.getName());

if (!app.requestSingleInstanceLock()) {
  app.quit();
  process.exit(0);
}

let win: BrowserWindow | null = null;
const preload = path.join(__dirname, "../preload/index.mjs");
const indexHtml = path.join(RENDERER_DIST, "index.html");

async function createWindow() {
  win = new BrowserWindow({
    title: "Main window",
    autoHideMenuBar: true,
    frame: true,
    titleBarStyle: "hidden",
    width: 1280,
    height: 768,
    icon: path.join(process.env.VITE_PUBLIC, "favicon.ico"),
    webPreferences: {
      preload,
    },
  });

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL);
    win.webContents.openDevTools();
  } else {
    win.loadFile(path.join("dist", "index.html"));
  }

  // Test actively push message to the Electron-Renderer
  win.webContents.on("did-finish-load", () => {
    win?.webContents.send("main-process-message", new Date().toLocaleString());
  });

  // Make all links open with the browser, not with the application
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith("https:")) shell.openExternal(url);
    return { action: "deny" };
  });

  // Auto update
  update(win);
}

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  win = null;
  if (process.platform !== "darwin") app.quit();
});

app.on("second-instance", () => {
  if (win) {
    // Focus on the main window if the user tried to open another
    if (win.isMinimized()) win.restore();
    win.focus();
  }
});

app.on("activate", () => {
  const allWindows = BrowserWindow.getAllWindows();
  if (allWindows.length) {
    allWindows[0].focus();
  } else {
    createWindow();
  }
});

// New window example arg: new windows url
ipcMain.handle("open-win", (_, arg) => {
  const childWindow = new BrowserWindow({
    frame: false,
    titleBarStyle: "hidden",
    webPreferences: {
      preload,
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  if (VITE_DEV_SERVER_URL) {
    childWindow.loadURL(`${VITE_DEV_SERVER_URL}#${arg}`);
  } else {
    childWindow.loadFile(indexHtml, { hash: arg });
  }
});

function extractSubtitles(
  mkvPath: string,
  outputPath: string,
  subtitleStreamIndex = 0
) {
  const ffmpegArgs = [
    "-y",
    "-i",
    mkvPath,
    "-map",
    `0:s:${subtitleStreamIndex}`,
    outputPath,
  ];
  const ffmpeg = spawn("ffmpeg", ffmpegArgs);

  ffmpeg.on("close", (code) => {
    if (code === 0) {
      console.log("Subtitle extraction complete:", outputPath);
    } else {
      console.log("Output path:", outputPath);
      console.error("ffmpeg exited with code", code);
    }
  });
}

client.on("torrent", (torrent) => {
  torrent.on("done", () => {
    const mkvFile = torrent.files.find((f) => /\.mkv$/.test(f.name));
    if (mkvFile) {
      const mkvPath = path.join(torrent.path, mkvFile.name);
      const baseName = path.basename(mkvFile.name, ".mkv");
      const subtitlePath = path.join(
        app.getPath("userData"),
        "subtitles",
        `${torrent.infoHash}.vtt`
      );
      if (!fs.existsSync(path.dirname(subtitlePath))) {
        fs.mkdirSync(path.dirname(subtitlePath), { recursive: true });
      }
      // check if subtitles file already exists
      if (fs.existsSync(subtitlePath)) {
        console.log("Subtitles already extracted:", subtitlePath);
        return;
      }
      extractSubtitles(mkvPath, subtitlePath, 0);
    }
  });
});

ipcMain.handle("get-anime-data", async () => {
  try {
    //const animeList = await getCurrentSeasonAnimeWithTorrents();
    const animeList = await getAnime();
    return animeList;
  } catch (error) {
    console.error("Error fetching anime data:", error);
    throw error;
  }
});

ipcMain.handle("fetch-torrents-for-anime", async (event, anime) => {
  try {
    const { fetchTorrentsForAnime } = await import("../services/nyaapi");
    const episodeList = await fetchTorrentsForAnime(anime);
    return episodeList;
  } catch (error) {
    console.error("Error fetching torrents for anime:", error);
    throw error;
  }
});

ipcMain.handle("webtorrent:add", async (_event, magnetURI: string) => {
  try {
    const infoHash = parseTorrent(magnetURI).infoHash;
    const existing = client.torrents.find(
      (t) => t.magnetURI === magnetURI || t.infoHash === infoHash
    );
    if (existing) {
      return {
        infoHash: existing.infoHash,
        magnetURI: existing.magnetURI,
        name: existing.name,
        files: existing.files.map((f) => ({ name: f.name, length: f.length })),
        alreadyAdded: true,
      };
    }

    return new Promise((resolve) => {
      let resolved = false;
      try {
        const torrent = client.add(
          magnetURI,
          (torrent: { infoHash: any; name: any; files: any[] }) => {
            if (resolved) return;
            resolved = true;
            resolve({
              infoHash: torrent.infoHash,
              magnetURI: magnetURI,
              name: torrent.name,
              files: torrent.files.map((f) => ({
                name: f.name,
                length: f.length,
              })),
              alreadyAdded: false,
            });
          }
        );

        torrent.on("error", () => {
          if (resolved) return;
          resolved = true;
          resolve({
            infoHash,
            magnetURI,
            name: "",
            files: [],
            alreadyAdded: true,
          });
        });
      } catch (err) {
        if (resolved) return;
        resolved = true;
        resolve({
          infoHash,
          magnetURI,
          name: "",
          files: [],
          alreadyAdded: true,
        });
      }
    });
  } catch (err) {
    return {
      infoHash: "",
      magnetURI,
      name: "",
      files: [],
      alreadyAdded: true,
    };
  }
});

ipcMain.handle("webtorrent:list", () => {
  return client.torrents.map(
    (torrent: {
      infoHash: any;
      name: any;
      progress: any;
      magnetURI: any;
      timeRemaining: any;
      ratio: any;
      numPeers: any;
      path: any;
      done: any;
      downloaded: any;
      uploaded: any;
      downloadSpeed: any;
      uploadSpeed: any;
      files: any[];
    }) => ({
      infoHash: torrent.infoHash,
      name: torrent.name,
      progress: torrent.progress,
      magnetURI: torrent.magnetURI,
      timeRemaining: torrent.timeRemaining,
      ratio: torrent.ratio,
      numPeers: torrent.numPeers,
      path: torrent.path,
      done: torrent.done,
      downloaded: torrent.downloaded,
      uploaded: torrent.uploaded,
      downloadspeed: torrent.downloadSpeed,
      uploadspeed: torrent.uploadSpeed,
      files: torrent.files.map((f) => ({ name: f.name, length: f.length })),
    })
  );
});

ipcMain.handle("webtorrent:remove", async (_event, infoHash: string) => {
  const torrent = await client.get(infoHash);
  if (torrent) {
    try {
      await client.remove(torrent);
      return true;
    } catch (error) {
      console.error("Error removing torrent:", error);
    }
  }
  return false;
});

ipcMain.handle("webtorrent:get-file-path", (_event, infoHash: string) => {
  const torrent = client.get(infoHash);
  if (!torrent || !torrent.files) return null;
  const file = torrent.files.find((f) => f.name.endsWith(".mkv"));
  return file ? file.path : null;
});

import express from "express";

const expressApp = express();
const subtitlesDir = path.join(app.getPath("userData"), "subtitles");
expressApp.use("/subtitles", express.static(subtitlesDir));

const subtitleServer = expressApp.listen(3001, () => {
  console.log("Subtitle server running at http://localhost:3001/subtitles");
});

ipcMain.handle("webtorrent:stream", async (event, infoHash: string) => {
  //const torrent = await client.get(infoHash);
  const torrent = await client.torrents.find(
    (t: any) => t.infoHash === infoHash
  );
  client.torrents.forEach((torrent: any) => {
    console.log("Torrent:", torrent.name, torrent.infoHash);
  });
  console.log("Requested torrent:", infoHash);
  console.log("Torrent found:", torrent ? torrent.name : "Not found");

  if (!torrent) {
    event.sender.send("stream-url", null);
    return;
  }
  if (torrent) {
    try {
      console.log("Requested torrent:", torrent.name);
      console.log("Requested torrent:", torrent.infoHash);

      function startStreaming(file: {
        length: number;
        createReadStream: (arg0: { start: number; end: number }) => any;
      }) {
        if (!file) {
          console.log("no .mkv file found in torrent");
          event.sender.send("stream-url", null);
          return;
        }

        const server = http.createServer((req, res) => {
          const range = req.headers.range;
          if (!range) {
            res.statusCode = 416;
            return res.end();
          }

          const positions = range.replace(/bytes=/, "").split("-");
          const start = parseInt(positions[0], 10);
          const end = positions[1]
            ? parseInt(positions[1], 10)
            : file.length - 1;
          const chunksize = end - start + 1;

          res.writeHead(206, {
            "Content-Range": `bytes ${start}-${end}/${file.length}`,
            "Accept-Ranges": "bytes",
            "Content-Length": chunksize,
            "Content-Type": "video/x-matroska",
          });

          const stream = file.createReadStream({ start, end });
          stream.pipe(res);
        });

        server.listen(0, () => {
          const address = server.address();
          const port =
            address && typeof address === "object" && "port" in address
              ? (address as any).port
              : null;
          const url = port ? `http://localhost:${port}` : null;
          event.sender.send("stream-url", url);
        });
      }

      if (torrent.ready) {
        const file = torrent.files.find((f: { name: string }) =>
          /\.mkv$/.test(f.name)
        );
        if (file) {
          startStreaming(file);
        } else {
          console.log("no .mkv file found in torrent");
          event.sender.send("stream-url", null);
        }
      }
    } catch (error) {
      console.error("Error streaming torrent:", error);
      event.sender.send("stream-url", null);
    }
  }
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection:", reason);
});

ipcMain.handle("shell:openPath", async (_event, folderPath: string) => {
  await shell.openPath(folderPath);
});

ipcMain.handle("window-minimize", () => {
  if (win && !win.isDestroyed()) {
    win.minimize();
    return true;
  }
  return false;
});

ipcMain.handle("window-maximize", () => {
  if (win && !win.isDestroyed()) {
    if (win.isMaximized()) {
      win.unmaximize();
    } else {
      win.maximize();
    }
    return true;
  }
  return false;
});

ipcMain.handle("window-close", () => {
  if (win && !win.isDestroyed()) {
    win.close();
    return true;
  }
  return false;
});

client.on('error', (err) => {
  console.error('WebTorrent client error:', err);
  // If it's a UDP-related error, you might want to restart the client
  if (err.message && (
      err.message.includes('UDP') || 
      err.message.includes('EADDRINUSE') ||
      err.message.includes('ECONNRESET')
    )) {
    console.log('UDP-related error detected, handling...');
    // Handle UDP error (potentially restart client)
  }
});
