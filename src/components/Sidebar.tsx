import React from 'react';
import { Home, Search, Library, Heart } from 'lucide-react';
import { clsx } from 'clsx';
import type { LocalPlaylist } from '../types';
import { CoverImage } from './ui/CoverImage';
import { buildFileUrl } from '../api';

interface SidebarProps {
  activeTab: 'search' | 'toplists' | 'library' | 'playlist';
  onTabChange: (tab: 'search' | 'toplists' | 'library' | 'playlist') => void;
  playlists: LocalPlaylist[];
  activePlaylistId: string;
  onPlaylistSelect: (id: string) => void;
  onCreatePlaylist: () => void;
  onDeletePlaylist: (id: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onTabChange,
  playlists,
  activePlaylistId,
  onPlaylistSelect,
}) => {
  return (
    <div className="w-64 bg-black h-full flex flex-col p-4 gap-6 text-gray-400">
      <div className="flex flex-col gap-2">
        <div className="px-4 py-2 mb-2 text-white font-bold text-xl flex items-center gap-3">
          <img src="/logo.svg" alt="Logo" className="w-10 h-10" />
          <span className="tracking-tight">InspireMusic</span>
        </div>
        <button
          onClick={() => onTabChange('search')}
          className={clsx(
            "flex items-center gap-4 px-4 py-3 rounded-md transition-colors font-medium",
            activeTab === 'search' ? "text-white bg-surface" : "hover:text-white hover:bg-surface/50"
          )}
        >
          <Search size={24} />
          搜索
        </button>
        <button
          onClick={() => onTabChange('toplists')}
          className={clsx(
            "flex items-center gap-4 px-4 py-3 rounded-md transition-colors font-medium",
            activeTab === 'toplists' ? "text-white bg-surface" : "hover:text-white hover:bg-surface/50"
          )}
        >
          <Home size={24} />
          排行榜
        </button>
      </div>

      <div className="flex-1 flex flex-col gap-2 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-2">
          <button
            onClick={() => onTabChange('library')}
            className={clsx(
              "flex items-center gap-2 font-bold transition-colors",
              activeTab === 'library' ? "text-white" : "hover:text-white"
            )}
          >
            <Library size={24} />
            音乐库
          </button>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {playlists.map((pl) => (
            <div
              key={pl.id}
              className={clsx(
                "group flex items-center justify-between px-4 py-2 rounded-md cursor-pointer transition-colors text-sm",
                activePlaylistId === pl.id ? "text-white bg-surface" : "hover:text-white hover:bg-surface/50"
              )}
              onClick={() => onPlaylistSelect(pl.id)}
            >
              <div className="flex items-center gap-3 overflow-hidden">
                {pl.id === 'favorites' ? (
                  <div className="min-w-[32px] h-8 w-8 rounded flex items-center justify-center bg-gradient-to-br from-pink-500 to-purple-600 shrink-0">
                    <Heart size={16} fill="white" className="text-white" />
                  </div>
                ) : (
                  <CoverImage
                    src={pl.pic || pl.songs[0]?.pic || (pl.songs[0] ? buildFileUrl(pl.songs[0].platform, pl.songs[0].id, 'pic') : undefined)}
                    alt={pl.name}
                    className="min-w-[32px] h-8 w-8 rounded object-cover bg-gray-800 shrink-0"
                    iconSize={16}
                  />
                )}
                <span className="truncate">{pl.name}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
