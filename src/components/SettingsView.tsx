import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Switch } from "./ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Separator } from "./ui/separator";
import { FolderOpen, Save, Keyboard, Download, PlaySquare } from "lucide-react";
import { useSettings } from "@/store/settingsStore";

export function SettingsView() {
  const { settings, setSettings } = useSettings();

  const handleBrowseFolder = () => {
    window.ipcRenderer.invoke("shell:openPath", settings.downloadPath);
  };

  return (
    <div className="p-6 max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-medium text-foreground mb-2">Settings</h1>
        <p className="text-muted-foreground">
          This page is actually mostly a placeholder. Settings are not yet
          implemented. It looks pretty though!
        </p>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>
              <span className="inline-flex items-center gap-2">
                <Keyboard className="h-5 w-5" />
                Shortcuts
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="downloadPath">
                Left-click to pause the player
              </Label>
              <Label htmlFor="downloadPath">
                Right-click to toggle fullscreen
              </Label>
              <Label htmlFor="downloadPath">
                Ctrl+B to hide/show the sidebar
              </Label>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>
              <span className="inline-flex items-center gap-2">
                <Download className="h-5 w-5" />
                Download Settings
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="downloadPath">Download Path</Label>
              <div className="flex gap-2">
                <Input
                  disabled
                  id="downloadPath"
                  value={settings.downloadPath}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      downloadPath: e.target.value,
                    })
                  }
                  className="flex-1"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleBrowseFolder}
                  className="gap-2"
                >
                  <FolderOpen className="h-4 w-4" />
                  Open
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="subtitlePath">Subtitle Path</Label>
              <div className="flex gap-2">
                <Input
                  disabled
                  id="subtitlePath"
                  value={settings.subtitlePath}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      subtitlePath: e.target.value,
                    })
                  }
                  className="flex-1"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleBrowseFolder}
                  className="gap-2"
                  disabled
                >
                  <FolderOpen className="h-4 w-4" />
                  Open
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="maxDownload">Max Download Speed (KB/s)</Label>
                <Input
                  id="maxDownload"
                  value={settings.maxDownloadSpeed}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      maxDownloadSpeed: e.target.value,
                    })
                  }
                  placeholder="0 = unlimited"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="maxUpload">Max Upload Speed (KB/s)</Label>
                <Input
                  id="maxUpload"
                  value={settings.maxUploadSpeed}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      maxUploadSpeed: e.target.value,
                    })
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="maxTorrents">Max Active Torrents</Label>
              <Input
                id="maxTorrents"
                value={settings.maxActiveTorrents}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    maxActiveTorrents: e.target.value,
                  })
                }
                className="w-32"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>
              <span className="inline-flex items-center gap-2">
                <PlaySquare className="h-5 w-5" />
                Playback Settings
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="videoQuality">Preferred Video Quality</Label>
              <Select
                value={settings.videoQuality}
                onValueChange={(value) =>
                  setSettings({
                    ...settings,
                    videoQuality: value,
                  })
                }
              >
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="720p">720p</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="subtitleLang">Subtitle Language</Label>
              <Select
                value={settings.subtitleLanguage}
                onValueChange={(value) =>
                  setSettings({
                    ...settings,
                    subtitleLanguage: value,
                  })
                }
              >
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="preferredGroup">Preferred Group</Label>
              <Select
                value={settings.preferredGroup}
                onValueChange={(value) =>
                  setSettings({
                    ...settings,
                    subtitleLanguage: value,
                  })
                }
              >
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="[SubsPlease]">[SubsPlease]</SelectItem>
                  <SelectItem disabled value="[Erai-raws]">
                    [Erai-raws]
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Separator />
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Subtitles </Label>
                  <p className="text-sm text-muted-foreground">
                    Enable subtitles for video playback
                  </p>
                </div>
                <Switch
                  checked={settings.subtitle}
                  onCheckedChange={(checked) =>
                    setSettings({
                      ...settings,
                      subtitle: checked,
                    })
                  }
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>General Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Auto-start downloads</Label>
                <p className="text-sm text-muted-foreground">
                  Automatically start downloading when torrents are added
                </p>
              </div>
              <Switch
                checked={settings.autoStart}
                onCheckedChange={(checked) =>
                  setSettings({
                    ...settings,
                    autoStart: checked,
                  })
                }
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Auto-add new torrents</Label>
                <p className="text-sm text-muted-foreground">
                  Enable automatic addition of new torrents
                </p>
              </div>
              <Switch
                checked={settings.autoAddNewTorrents}
                onCheckedChange={(checked) =>
                  setSettings({
                    ...settings,
                    autoAddNewTorrents: checked,
                  })
                }
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Show notifications when downloads complete
                </p>
              </div>
              <Switch
                checked={settings.notifications}
                onCheckedChange={(checked) =>
                  setSettings({
                    ...settings,
                    notifications: checked,
                  })
                }
              />
            </div>
          </CardContent>
        </Card>

        {/*<div className="flex justify-end">
          <Button onClick={handleSave} className="gap-2">
            <Save className="h-4 w-4" />
            Save Settings
          </Button>
        </div>*/}
      </div>
    </div>
  );
}
