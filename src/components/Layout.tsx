import React from 'react';
import { AnimatePresence } from 'framer-motion';
import { TitleBar } from './TitleBar';

interface LayoutProps {
  sidebar: React.ReactNode;
  bottomNav?: React.ReactNode;
  player: React.ReactNode;
  children: React.ReactNode;
  lyricsOverlay?: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ sidebar, bottomNav, player, children, lyricsOverlay }) => {
  return (
    <div className="flex flex-col h-screen bg-black text-white overflow-hidden">
      {/* 自定义标题栏 - 仅在 Tauri 环境显示 */}
      <TitleBar />

      <div className="flex-1 flex overflow-hidden">
        <div className="hidden md:block h-full">
          {sidebar}
        </div>
        <main className="flex-1 bg-background relative overflow-hidden flex flex-col">
          {/* Top gradient overlay for depth */}
          <div className="absolute top-0 left-0 right-0 h-64 bg-gradient-to-b from-primary/10 to-transparent pointer-events-none z-0" />

          <div className="flex-1 overflow-y-auto custom-scrollbar relative z-10">
            {children}
          </div>
        </main>
      </div>
      {player}
      {bottomNav}
      <AnimatePresence>
        {lyricsOverlay}
      </AnimatePresence>
    </div>
  );
};
