import React from 'react';
import { Icon, Minus, Square, X } from 'lucide-react';
import { IconProps } from 'lucide-react';

interface TitleBarProps {
  icon?: React.ComponentType<IconProps>;
}

export function TitleBar({ icon: Icon }: TitleBarProps) {
  const handleMinimize = () => {
    window.ipcRenderer.invoke('window-minimize');
  };

  const handleMaximize = () => {
    window.ipcRenderer.invoke('window-maximize');
  };

  const handleClose = () => {
    window.ipcRenderer.invoke('window-close');
  };

  return (
    <header
      className="h-8 flex items-center justify-between bg-sidebar border-b border-sidebar-border select-none"
      style={{ WebkitAppRegion: 'drag' } as any}
    >
      <div className="flex items-center gap-2 px-4">
        {/*<div className="w-4 h-4 bg-gradient-to-br from-red-300 to-red-purple rounded-md" /> */}
        <span className="text-sm text-sidebar-foreground">🌀</span>
      </div>

      <div className="flex items-center gap-2 px-4">
        {/*<div className="w-4 h-4 bg-gradient-to-br from-red-300 to-red-purple rounded-md" /> */}
        <span className="text-sm text-sidebar-foreground">{Icon && <Icon className="h-4 w-4 text-sidebar-foreground" />}</span>
      </div>

      <div className="flex" style={{ WebkitAppRegion: 'no-drag' } as any}>
        <button
          onClick={handleMinimize}
          className="w-12 h-8 flex items-center justify-center hover:bg-sidebar-accent/50 transition-colors"
          title="Minimize"
        >
          <Minus className="w-4 h-4 text-sidebar-foreground" />
        </button>
        <button
          onClick={handleMaximize}
          className="w-12 h-8 flex items-center justify-center hover:bg-sidebar-accent/50 transition-colors"
          title="Maximize"
        >
          <Square className="w-3.5 h-3.5 text-sidebar-foreground" />
        </button>
        <button
          onClick={handleClose}
          className="w-12 h-8 flex items-center justify-center hover:bg-red-500 transition-colors group"
          title="Close"
        >
          <X className="w-4 h-4 text-sidebar-foreground group-hover:text-white" />
        </button>
      </div>
    </header>
  );
}