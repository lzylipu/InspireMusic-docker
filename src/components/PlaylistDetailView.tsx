import React from 'react';
import type { Song, LocalPlaylist, Platform } from '../types';
import { SongList } from './SongList';
import { Play, Edit2, Trash2, Heart } from 'lucide-react';
import { CoverImage } from './ui/CoverImage';
import { buildFileUrl } from '../api';
import { getGradientFromId } from '../utils/colors';

interface PlaylistDetailViewProps {
  playlist: LocalPlaylist;
  currentSong: Song | null;
  isPlaying: boolean;
  onPlay: (song: Song) => void;
  onPlayAll: () => void;
  onRename?: () => void;
  onDelete?: () => void;
}

export const PlaylistDetailView: React.FC<PlaylistDetailViewProps> = ({
  playlist,
  currentSong,
  isPlaying,
  onPlay,
  onPlayAll,
  onRename,
  onDelete,
}) => {
  const platformLabels: Record<Platform, string> = {
    netease: '网易云',
    kuwo: '酷我',
    qq: 'QQ',
  };

  const coverSrc =
    playlist.pic ||
    playlist.songs[0]?.pic ||
    (playlist.songs[0] ? buildFileUrl(playlist.songs[0].platform, playlist.songs[0].id, 'pic') : undefined);

  const isFavorites = playlist.id === 'favorites';
  const coverContainerClass = isFavorites
    ? 'bg-gradient-to-br from-pink-500 to-purple-600'
    : getGradientFromId(playlist.id);

  return (
    <div className="p-4 md:p-8">
      <div className="flex flex-col md:flex-row md:items-end gap-4 md:gap-6 mb-6 md:mb-8">
        <div className={`w-32 h-32 md:w-52 md:h-52 shadow-2xl rounded-lg overflow-hidden flex items-center justify-center flex-shrink-0 ${coverContainerClass}`}>
          {isFavorites ? (
            <Heart size={80} fill="white" className="text-white" />
          ) : (
            <CoverImage
              src={coverSrc}
              alt={playlist.name}
              className="w-full h-full object-cover"
              iconSize={80}
            />
          )}
        </div>
        <div className="flex flex-col gap-2 md:gap-4">
          <span className="text-xs md:text-sm font-bold uppercase tracking-wider">歌单</span>
          <div className="flex items-center gap-3 group">
            <h1 className="text-3xl md:text-6xl font-black text-white mb-1 md:mb-2">{playlist.name}</h1>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-400">
            {isFavorites ? (
              <span>{playlist.songs.length} 首歌曲</span>
            ) : (
              <>
                <span className="font-bold text-white">{playlist.origin || 'User'}</span>
                {playlist.source && (
                  <>
                    <span>•</span>
                    <span>{platformLabels[playlist.source]}</span>
                  </>
                )}
                <span>•</span>
                <span>{playlist.songs.length} 首歌曲</span>
              </>
            )}
          </div>
          {!!playlist.desc && (
            <p className="text-sm text-gray-400 max-w-3xl">{playlist.desc}</p>
          )}
        </div>
      </div>

      <div className="mb-8 flex items-center gap-4">
        <button
          onClick={onPlayAll}
          className="w-14 h-14 bg-primary rounded-full flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-lg shadow-primary/20"
          title="播放全部"
        >
          <Play size={28} fill="black" className="text-black ml-1" />
        </button>
        
        {onRename && playlist.id !== 'favorites' && (
          <button
            onClick={onRename}
            className="w-14 h-14 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20 hover:scale-105 active:scale-95 transition-all"
            title="重命名"
          >
            <Edit2 size={24} className="text-white" />
          </button>
        )}

        {onDelete && playlist.id !== 'favorites' && (
          <button
            onClick={onDelete}
            className="w-14 h-14 bg-red-600 rounded-full flex items-center justify-center hover:bg-red-700 hover:scale-105 active:scale-95 transition-all shadow-lg shadow-red-600/20"
            title="删除歌单"
          >
            <Trash2 size={24} className="text-white" />
          </button>
        )}
      </div>

      <div className="bg-black/20 rounded-xl overflow-hidden">
        <SongList
          songs={playlist.songs.map(s => ({
            ...s,
            pic: s.pic || buildFileUrl(s.platform, s.id, 'pic')
          }))}
          currentSong={currentSong}
          isPlaying={isPlaying}
          onPlay={onPlay}
        />
      </div>
    </div>
  );
};
