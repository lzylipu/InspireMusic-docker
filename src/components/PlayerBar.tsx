import React, { useState, useRef, useLayoutEffect } from 'react';
import { Play, Pause, SkipBack, SkipForward, Shuffle, Repeat, Volume2, VolumeX, List, Heart } from 'lucide-react';
import { clsx } from 'clsx';
import type { Song } from '../types';
import { Slider } from './ui/Slider';
import { CoverImage } from './ui/CoverImage';

interface PlayerBarProps {
  currentSong: Song | null;
  coverUrl?: string;
  isPlaying: boolean;
  progress: number;
  duration: number;
  volume: number;
  playMode: 'list' | 'shuffle' | 'single';
  onPlayPause: () => void;
  onNext: () => void;
  onPrev: () => void;
  onSeek: (time: number) => void;
  onVolumeChange: (vol: number) => void;
  onToggleMode: () => void;
  onTogglePlaylist: () => void;
  onToggleLyrics: () => void;
  onToggleFavorite: () => void;
  isFavorite: boolean;
}

const formatTime = (seconds: number) => {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60).toString().padStart(2, '0');
  return `${mins}:${secs}`;
};

export const PlayerBar: React.FC<PlayerBarProps> = ({
  currentSong,
  coverUrl,
  isPlaying,
  progress,
  duration,
  volume,
  playMode,
  onPlayPause,
  onNext,
  onPrev,
  onSeek,
  onVolumeChange,

  onToggleMode,
  onTogglePlaylist,
  onToggleLyrics,
  onToggleFavorite,
  isFavorite,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [dragValue, setDragValue] = useState(0);
  const prevProgressRef = useRef(progress);

  // Use useLayoutEffect to update drag value synchronously
  /* eslint-disable react-hooks/set-state-in-effect -- Intentional: sync derived state when progress prop changes */
  useLayoutEffect(() => {
    if (!isDragging && prevProgressRef.current !== progress) {
      prevProgressRef.current = progress;
      setDragValue(progress);
    }
  }, [progress, isDragging]);
  /* eslint-enable react-hooks/set-state-in-effect */

  return (
    <div className="h-16 md:h-24 bg-surface border-t border-gray-800 px-2 md:px-4 flex items-center justify-between z-50 relative">
      {/* Song Info */}
      <div className="flex items-center gap-2 md:gap-4 flex-1 md:w-[30%] md:min-w-[200px] overflow-hidden">
        {currentSong ? (
          <>
            <div onClick={onToggleLyrics} className="cursor-pointer flex-shrink-0">
              <CoverImage
                src={coverUrl || currentSong.pic}
                alt={currentSong.name}
                className="w-10 h-10 md:w-14 md:h-14 rounded shadow-md object-cover"
              />
            </div>
            <div className="flex flex-col overflow-hidden min-w-0" onClick={onToggleLyrics}>
              <span className="text-white text-xs md:text-sm font-medium truncate hover:underline cursor-pointer">
                {currentSong.name}
              </span>
              <span className="text-gray-400 text-[10px] md:text-xs truncate hover:underline cursor-pointer">
                {currentSong.artist}
              </span>
            </div>
            <button
              onClick={onToggleFavorite}
              className={clsx("hidden md:block hover:scale-110 transition-transform", isFavorite ? "text-primary" : "text-gray-400 hover:text-white")}
            >
              <Heart size={18} fill={isFavorite ? "currentColor" : "none"} />
            </button>
          </>
        ) : null}
      </div>

      {/* Desktop Controls */}
      <div className="hidden md:flex flex-col items-center gap-2 w-[40%] max-w-[600px]">
        <div className="flex items-center gap-6">
          <button
            onClick={onToggleMode}
            className={clsx("text-gray-400 hover:text-white transition-colors", playMode !== 'list' && "text-primary")}
            title={playMode === 'shuffle' ? '随机播放' : playMode === 'single' ? '单曲循环' : '列表循环'}
          >
            {playMode === 'shuffle' ? <Shuffle size={20} /> : playMode === 'single' ? <Repeat size={20} className="relative"><span className="absolute -top-1 -right-1 text-[8px]">1</span></Repeat> : <Repeat size={20} />}
          </button>
          <button onClick={onPrev} className="text-gray-400 hover:text-white transition-colors">
            <SkipBack size={24} fill="currentColor" />
          </button>
          <button
            onClick={onPlayPause}
            className="w-8 h-8 bg-white rounded-full flex items-center justify-center hover:scale-105 transition-transform"
          >
            {isPlaying ? <Pause size={20} fill="black" className="text-black" /> : <Play size={20} fill="black" className="text-black ml-1" />}
          </button>
          <button onClick={onNext} className="text-gray-400 hover:text-white transition-colors">
            <SkipForward size={24} fill="currentColor" />
          </button>
          <button className="text-gray-400 hover:text-white transition-colors opacity-0 cursor-default">
            {/* Placeholder for symmetry */}
            <Shuffle size={20} />
          </button>
        </div>
        <div className="flex items-center gap-2 w-full text-xs text-gray-400 font-mono">
          <span className="w-10 text-right">{formatTime(progress)}</span>
          <Slider
            value={progress}
            max={duration || 100}
            onChange={(e) => onSeek(Number(e.target.value))}
          />
          <span className="w-10">{formatTime(duration)}</span>
        </div>
      </div>

      {/* Mobile Controls */}
      <div className="flex md:hidden items-center gap-3 mr-2">
        {/* Volume Control for Mobile */}
        <div className="flex items-center gap-1">
          <button onClick={() => onVolumeChange(volume === 0 ? 0.8 : 0)}>
            {volume === 0 ? <VolumeX size={20} className="text-gray-400" /> : <Volume2 size={20} className="text-gray-400" />}
          </button>
          <Slider
            value={volume * 100}
            max={100}
            onChange={(e) => onVolumeChange(Number(e.target.value) / 100)}
            className="w-14"
          />
        </div>
        <button
          onClick={onToggleFavorite}
          className={clsx("text-gray-400 hover:text-white transition-colors", isFavorite && "text-primary")}
        >
          <Heart size={20} fill={isFavorite ? "currentColor" : "none"} />
        </button>
        <button onClick={onPrev} className="text-gray-400 hover:text-white transition-colors">
          <SkipBack size={20} fill="currentColor" />
        </button>
        <button
          onClick={onPlayPause}
          className="w-8 h-8 bg-white rounded-full flex items-center justify-center hover:scale-105 transition-transform"
        >
          {isPlaying ? <Pause size={16} fill="black" className="text-black" /> : <Play size={16} fill="black" className="text-black ml-1" />}
        </button>
        <button onClick={onNext} className="text-gray-400 hover:text-white transition-colors">
          <SkipForward size={20} fill="currentColor" />
        </button>
        <button
          onClick={onToggleMode}
          className={clsx("text-gray-400 hover:text-white transition-colors", playMode !== 'list' && "text-primary")}
        >
          {playMode === 'shuffle' ? <Shuffle size={20} /> : playMode === 'single' ? <Repeat size={20} className="relative"><span className="absolute -top-1 -right-1 text-[8px]">1</span></Repeat> : <Repeat size={20} />}
        </button>
        <button
          onClick={onTogglePlaylist}
          className="text-gray-400 hover:text-white transition-colors"
        >
          <List size={20} />
        </button>
      </div>

      {/* Right Section (Desktop) */}
      <div className="hidden md:flex items-center gap-4 w-[30%] justify-end">
        <button
          onClick={onTogglePlaylist}
          className="text-gray-400 hover:text-white transition-colors"
          title="播放队列"
        >
          <List size={20} />
        </button>
        <div className="flex items-center gap-2 w-32 group">
          <button onClick={() => onVolumeChange(volume === 0 ? 0.8 : 0)}>
            {volume === 0 ? <VolumeX size={20} className="text-gray-400" /> : <Volume2 size={20} className="text-gray-400 group-hover:text-white" />}
          </button>
          <Slider
            value={volume * 100}
            max={100}
            onChange={(e) => onVolumeChange(Number(e.target.value) / 100)}
            className="w-24"
          />
        </div>
      </div>

      {/* Mobile Progress Bar */}
      <div className="absolute bottom-0 left-0 right-0 h-[3px] md:hidden group">
        <div className="absolute inset-0 bg-gray-800" />
        <div
          className="absolute top-0 left-0 h-full bg-primary transition-all duration-100 pointer-events-none"
          style={{ width: `${((isDragging ? dragValue : progress) / (duration || 1)) * 100}%` }}
        />

        {/* Time Preview Tooltip */}
        {isDragging && (
          <div
            className="absolute bottom-6 -translate-x-1/2 bg-gray-900/90 text-white text-xs font-medium px-2 py-1 rounded border border-white/10 backdrop-blur-sm shadow-xl pointer-events-none"
            style={{ left: `${(dragValue / (duration || 1)) * 100}%` }}
          >
            {formatTime(dragValue)}
          </div>
        )}

        <input
          type="range"
          min={0}
          max={duration || 100}
          value={isDragging ? dragValue : progress}
          onChange={(e) => {
            const val = Number(e.target.value);
            setDragValue(val);
            onSeek(val);
          }}
          onTouchStart={() => setIsDragging(true)}
          onTouchEnd={() => setIsDragging(false)}
          onMouseDown={() => setIsDragging(true)}
          onMouseUp={() => setIsDragging(false)}
          className="absolute inset-0 w-full h-8 -top-4 opacity-0 cursor-pointer"
        />
      </div>
    </div>
  );
};
