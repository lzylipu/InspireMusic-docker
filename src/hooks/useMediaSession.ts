import { useEffect, useRef, useCallback } from 'react';

interface UseMediaSessionOptions {
  title: string;
  artist: string;
  album?: string;
  artwork?: string;
  duration: number;
  position: number;
  isPlaying: boolean;
  onPlay: () => void;
  onPause: () => void;
  onNextTrack: () => void;
  onPrevTrack: () => void;
  onSeek: (time: number) => void;
}

// Default seek offset in seconds
const SEEK_OFFSET = 10;

/**
 * Custom hook to integrate with the Media Session API.
 * Displays current track info in browser/OS media notifications
 * and handles media key controls.
 * 
 * Enhanced for mobile background playback stability.
 */
export function useMediaSession({
  title,
  artist,
  album,
  artwork,
  duration,
  position,
  isPlaying,
  onPlay,
  onPause,
  onNextTrack,
  onPrevTrack,
  onSeek,
}: UseMediaSessionOptions): void {
  // Track previous values to detect changes
  const prevTitleRef = useRef(title);
  const prevArtworkRef = useRef(artwork);

  // Keep refs to latest callbacks to avoid re-registering handlers
  const callbacksRef = useRef({ onPlay, onPause, onNextTrack, onPrevTrack, onSeek });

  // Keep refs to latest values for position state updates
  const durationRef = useRef(duration);
  const positionRef = useRef(position);

  // Update callback refs
  useEffect(() => {
    callbacksRef.current = { onPlay, onPause, onNextTrack, onPrevTrack, onSeek };
  });

  // Update value refs
  useEffect(() => {
    durationRef.current = duration;
    positionRef.current = position;
  }, [duration, position]);

  // Memoized function to update position state
  const updatePositionState = useCallback((pos?: number) => {
    if (!('mediaSession' in navigator)) return;

    const dur = durationRef.current;
    const p = pos ?? positionRef.current;

    if (!dur || dur <= 0) return;

    try {
      navigator.mediaSession.setPositionState({
        duration: dur,
        playbackRate: 1,
        position: Math.max(0, Math.min(p, dur)),
      });
    } catch {
      // Some browsers may not support setPositionState
    }
  }, []);

  // Register action handlers once
  useEffect(() => {
    if (!('mediaSession' in navigator)) return;

    const mediaSession = navigator.mediaSession;

    // Play action
    mediaSession.setActionHandler('play', () => {
      callbacksRef.current.onPlay();
    });

    // Pause action
    mediaSession.setActionHandler('pause', () => {
      callbacksRef.current.onPause();
    });

    // Next track action
    mediaSession.setActionHandler('nexttrack', () => {
      callbacksRef.current.onNextTrack();
    });

    // Previous track action
    mediaSession.setActionHandler('previoustrack', () => {
      callbacksRef.current.onPrevTrack();
    });

    // Seek to specific time action
    mediaSession.setActionHandler('seekto', (details) => {
      if (details.seekTime !== undefined) {
        callbacksRef.current.onSeek(details.seekTime);
        // Update position state immediately after seek
        updatePositionState(details.seekTime);
      }
    });

    // Seek backward action (for mobile media controls)
    try {
      mediaSession.setActionHandler('seekbackward', (details) => {
        const offset = details.seekOffset || SEEK_OFFSET;
        const newTime = Math.max(0, positionRef.current - offset);
        callbacksRef.current.onSeek(newTime);
        updatePositionState(newTime);
      });
    } catch {
      // Not supported in all browsers
    }

    // Seek forward action (for mobile media controls)
    try {
      mediaSession.setActionHandler('seekforward', (details) => {
        const offset = details.seekOffset || SEEK_OFFSET;
        const newTime = Math.min(durationRef.current, positionRef.current + offset);
        callbacksRef.current.onSeek(newTime);
        updatePositionState(newTime);
      });
    } catch {
      // Not supported in all browsers
    }

    // Stop action (some platforms use this)
    try {
      mediaSession.setActionHandler('stop', () => {
        callbacksRef.current.onPause();
      });
    } catch {
      // Not supported in all browsers
    }

    // Cleanup handlers on unmount
    return () => {
      mediaSession.setActionHandler('play', null);
      mediaSession.setActionHandler('pause', null);
      mediaSession.setActionHandler('nexttrack', null);
      mediaSession.setActionHandler('previoustrack', null);
      mediaSession.setActionHandler('seekto', null);
      try { mediaSession.setActionHandler('seekbackward', null); } catch { /* ignore */ }
      try { mediaSession.setActionHandler('seekforward', null); } catch { /* ignore */ }
      try { mediaSession.setActionHandler('stop', null); } catch { /* ignore */ }
    };
  }, [updatePositionState]);

  // Update metadata when track info changes
  useEffect(() => {
    if (!('mediaSession' in navigator) || !title) return;

    // 歌曲变化时，先清除旧的 positionState，避免显示错误的进度
    if (prevTitleRef.current !== title) {
      try {
        navigator.mediaSession.setPositionState();
      } catch {
        // 忽略错误
      }
    }

    const artworkArray: MediaImage[] = artwork
      ? [
        { src: artwork, sizes: '512x512', type: 'image/jpeg' },
        { src: artwork, sizes: '256x256', type: 'image/jpeg' },
        { src: artwork, sizes: '128x128', type: 'image/jpeg' },
        { src: artwork, sizes: '96x96', type: 'image/jpeg' },
      ]
      : [];

    // Create and set new metadata
    navigator.mediaSession.metadata = new MediaMetadata({
      title,
      artist,
      album: album || '',
      artwork: artworkArray,
    });

    // Update refs
    prevTitleRef.current = title;
    prevArtworkRef.current = artwork;
  }, [title, artist, album, artwork]);

  // Update playback state - critical for notification persistence
  useEffect(() => {
    if (!('mediaSession' in navigator)) return;

    // Explicitly set playback state to ensure notification stays visible
    navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused';
  }, [isPlaying]);

  // Update position state for seek bar support
  useEffect(() => {
    if (!('mediaSession' in navigator)) return;

    // 如果 duration 还没准备好（新歌曲正在加载），不设置 positionState
    // 这样可以避免显示错误的时长信息
    if (!duration || duration <= 0) {
      return;
    }

    try {
      // 确保 position 在有效范围内
      navigator.mediaSession.setPositionState({
        duration,
        playbackRate: 1,
        position: Math.max(0, Math.min(position, duration)),
      });
    } catch {
      // Some browsers may not support setPositionState
    }
  }, [duration, position]);

  // Periodic position state refresh to keep notification alive on mobile
  // Some mobile browsers may lose track of media session if not updated
  useEffect(() => {
    if (!('mediaSession' in navigator) || !isPlaying) return;

    const intervalId = setInterval(() => {
      updatePositionState();
    }, 5000); // Refresh every 5 seconds while playing

    return () => clearInterval(intervalId);
  }, [isPlaying, updatePositionState]);
}

