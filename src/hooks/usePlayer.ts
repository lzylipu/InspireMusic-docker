import { useEffect, useRef, useCallback } from 'react';
import { useAppStore } from '../store/useAppStore';
import { buildFileUrl, getSongInfo, getLyrics } from '../api';
import { parseLyrics } from '../utils/lyrics';
import type { Song } from '../types';

/**
 * Custom hook that encapsulates all audio player logic
 */
export function usePlayer() {
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const animationFrameRef = useRef<number | null>(null);
    const lastProgressRef = useRef(0);
    const shouldAutoPlayRef = useRef(false);
    const playModeRef = useRef<'list' | 'shuffle' | 'single'>('list');
    const queueRef = useRef<Song[]>([]);
    const queueIndexRef = useRef(-1);

    // Get state and actions from store
    const {
        currentSong,
        queue,
        queueIndex,
        isPlaying,
        progress,
        duration,
        volume,
        playMode,
        quality,
        sleepEndTime,
        setCurrentSong,
        setCurrentInfo,
        setIsPlaying,
        setProgress,
        setDuration,
        setQueue,
        setQueueIndex,
        setLyrics,
        setParsedLyrics,
        setLyricsLoading,
        setInfoError,
        setSleepEndTime,
    } = useAppStore();

    // Keep refs in sync
    useEffect(() => {
        playModeRef.current = playMode;
    }, [playMode]);

    useEffect(() => {
        queueRef.current = queue;
    }, [queue]);

    useEffect(() => {
        queueIndexRef.current = queueIndex;
    }, [queueIndex]);

    // Initialize audio element
    useEffect(() => {
        const audio = new Audio();
        audioRef.current = audio;
        audio.volume = volume;

        const updateProgress = () => {
            if (audio && !audio.paused) {
                const currentTime = audio.currentTime || 0;
                if (Math.abs(currentTime - lastProgressRef.current) > 0.05) {
                    lastProgressRef.current = currentTime;
                    setProgress(currentTime);
                }
            }
            animationFrameRef.current = requestAnimationFrame(updateProgress);
        };

        const handleDuration = () => setDuration(Number.isFinite(audio.duration) ? audio.duration : 0);

        const handleEnded = () => {
            if (playModeRef.current === 'single') {
                audio.currentTime = 0;
                audio.play();
            } else {
                nextSong();
            }
        };

        const handlePlay = () => {
            setIsPlaying(true);
            if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
            animationFrameRef.current = requestAnimationFrame(updateProgress);
        };

        const handlePause = () => {
            setIsPlaying(false);
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
                animationFrameRef.current = null;
            }
        };

        const handleError = () => setIsPlaying(false);

        const handleSeeked = () => {
            setProgress(audio.currentTime || 0);
            lastProgressRef.current = audio.currentTime || 0;
        };

        audio.addEventListener('loadedmetadata', handleDuration);
        audio.addEventListener('ended', handleEnded);
        audio.addEventListener('play', handlePlay);
        audio.addEventListener('pause', handlePause);
        audio.addEventListener('error', handleError);
        audio.addEventListener('seeked', handleSeeked);

        return () => {
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
            audio.removeEventListener('loadedmetadata', handleDuration);
            audio.removeEventListener('ended', handleEnded);
            audio.removeEventListener('play', handlePlay);
            audio.removeEventListener('pause', handlePause);
            audio.removeEventListener('error', handleError);
            audio.removeEventListener('seeked', handleSeeked);
            audioRef.current = null;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps -- Intentional: audio element setup should only run once on mount
    }, []);

    // Update volume
    useEffect(() => {
        if (audioRef.current) audioRef.current.volume = volume;
    }, [volume]);

    // Load song when currentSong changes
    useEffect(() => {
        if (!currentSong || !audioRef.current) return;
        const audio = audioRef.current;
        const src = buildFileUrl(currentSong.platform, currentSong.id, 'url', quality);
        audio.src = src;

        if (shouldAutoPlayRef.current) {
            audio.play().catch(() => setIsPlaying(false));
        }

        loadSongDetails(currentSong);
        // eslint-disable-next-line react-hooks/exhaustive-deps -- Intentional: loadSongDetails is stable, setIsPlaying used via ref pattern
    }, [currentSong, quality]);

    // Sleep timer
    useEffect(() => {
        if (!sleepEndTime) return;

        const checkTimer = () => {
            if (Date.now() >= sleepEndTime) {
                setIsPlaying(false);
                if (audioRef.current) audioRef.current.pause();
                setSleepEndTime(null);
            }
        };

        const interval = setInterval(checkTimer, 1000);
        return () => clearInterval(interval);
        // eslint-disable-next-line react-hooks/exhaustive-deps -- Intentional: setters are stable from zustand
    }, [sleepEndTime]);

    // Load song details (info + lyrics)
    const loadSongDetails = useCallback(async (song: Song) => {
        setCurrentInfo(null);
        setLyrics('');
        setInfoError(null);
        setLyricsLoading(true);
        try {
            const info = await getSongInfo(song.platform, song.id);
            setCurrentInfo(info);
            const lyricText = await getLyrics(song.platform, song.id);
            setLyrics(lyricText);
            const parsed = parseLyrics(lyricText);
            setParsedLyrics(parsed);
        } catch {
            setInfoError('无法加载详情');
        } finally {
            setLyricsLoading(false);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps -- Intentional: setters are stable from zustand
    }, []);

    // Playback controls
    const startPlayback = useCallback((songs: Song[], index = 0) => {
        if (!songs.length) return;
        const boundedIndex = Math.max(0, Math.min(index, songs.length - 1));
        setQueue(songs);
        setQueueIndex(boundedIndex);
        shouldAutoPlayRef.current = true;
        setCurrentSong(songs[boundedIndex]);
        // eslint-disable-next-line react-hooks/exhaustive-deps -- Intentional: setters are stable from zustand
    }, []);

    const playSong = useCallback((song: Song) => {
        const idx = queueRef.current.findIndex(s => s.id === song.id && s.platform === song.platform);
        if (idx >= 0) {
            setQueueIndex(idx);
            shouldAutoPlayRef.current = true;
            setCurrentSong(queueRef.current[idx]);
        } else {
            const newQueue = [...queueRef.current, song];
            setQueue(newQueue);
            setQueueIndex(newQueue.length - 1);
            shouldAutoPlayRef.current = true;
            setCurrentSong(song);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps -- Intentional: using refs for queue access, setters are stable
    }, []);

    const nextSong = useCallback(() => {
        if (!queueRef.current.length) return;
        let nextIdx = queueIndexRef.current;
        const currentQueue = queueRef.current;

        if (playModeRef.current === 'shuffle') {
            let randomIdx = Math.floor(Math.random() * currentQueue.length);
            while (currentQueue.length > 1 && randomIdx === nextIdx) {
                randomIdx = Math.floor(Math.random() * currentQueue.length);
            }
            nextIdx = randomIdx;
        } else {
            nextIdx = (nextIdx + 1) % currentQueue.length;
        }

        setQueueIndex(nextIdx);
        shouldAutoPlayRef.current = true;
        setCurrentSong(currentQueue[nextIdx]);
        // eslint-disable-next-line react-hooks/exhaustive-deps -- Intentional: using refs for queue access, setters are stable
    }, []);

    const prevSong = useCallback(() => {
        if (!queueRef.current.length) return;
        let prevIdx = queueIndexRef.current;
        if (playModeRef.current === 'shuffle') {
            prevIdx = Math.floor(Math.random() * queueRef.current.length);
        } else {
            prevIdx = (prevIdx - 1 + queueRef.current.length) % queueRef.current.length;
        }
        setQueueIndex(prevIdx);
        shouldAutoPlayRef.current = true;
        setCurrentSong(queueRef.current[prevIdx]);
        // eslint-disable-next-line react-hooks/exhaustive-deps -- Intentional: using refs for queue access, setters are stable
    }, []);

    const togglePlayPause = useCallback(() => {
        if (audioRef.current) {
            if (isPlaying) {
                audioRef.current.pause();
            } else {
                shouldAutoPlayRef.current = true;
                audioRef.current.play();
            }
        }
    }, [isPlaying]);

    const handleSeek = useCallback((time: number) => {
        if (audioRef.current) {
            audioRef.current.currentTime = time;
            setProgress(time);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps -- Intentional: setProgress is stable from zustand
    }, []);

    return {
        // State (from store)
        currentSong,
        queue,
        queueIndex,
        isPlaying,
        progress,
        duration,
        volume,
        playMode,

        // Actions
        startPlayback,
        playSong,
        nextSong,
        prevSong,
        togglePlayPause,
        handleSeek,
    };
}
