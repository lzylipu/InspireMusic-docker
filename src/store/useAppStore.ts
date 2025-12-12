import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Song, SongInfo, Quality, LocalPlaylist, ParsedLyricLine } from '../types';

export interface PlayerState {
    // Current playback
    currentSong: Song | null;
    currentInfo: SongInfo | null;
    queue: Song[];
    queueIndex: number;

    // Playback state
    isPlaying: boolean;
    progress: number;
    duration: number;
    volume: number;
    playMode: 'list' | 'shuffle' | 'single';

    // Lyrics
    lyrics: string;
    parsedLyrics: ParsedLyricLine[];
    activeLyricIndex: number;
    lyricsLoading: boolean;

    // Quality
    quality: Quality;

    // Errors
    infoError: string | null;

    // Sleep timer
    sleepEndTime: number | null;

    // Saved progress for resume
    savedProgress: number;
}

export interface PlayerActions {
    // Setters
    setCurrentSong: (song: Song | null) => void;
    setCurrentInfo: (info: SongInfo | null) => void;
    setQueue: (queue: Song[]) => void;
    setQueueIndex: (index: number) => void;
    setIsPlaying: (playing: boolean) => void;
    setProgress: (progress: number) => void;
    setDuration: (duration: number) => void;
    setVolume: (volume: number) => void;
    setPlayMode: (mode: 'list' | 'shuffle' | 'single') => void;
    setLyrics: (lyrics: string) => void;
    setParsedLyrics: (lyrics: ParsedLyricLine[]) => void;
    setActiveLyricIndex: (index: number) => void;
    setLyricsLoading: (loading: boolean) => void;
    setQuality: (quality: Quality) => void;
    setInfoError: (error: string | null) => void;
    setSleepEndTime: (time: number | null) => void;

    // Actions
    clearQueue: () => void;
    removeFromQueue: (index: number) => void;
    saveProgress: (progress: number) => void;
}

export interface DataState {
    favorites: Song[];
    playlists: LocalPlaylist[];
}

export interface DataActions {
    setFavorites: (favorites: Song[]) => void;
    setPlaylists: (playlists: LocalPlaylist[]) => void;
    toggleFavorite: (song: Song) => void;
    addPlaylist: (playlist: LocalPlaylist) => void;
    updatePlaylist: (id: string, updates: Partial<LocalPlaylist>) => void;
    deletePlaylist: (id: string) => void;
    toggleSongInPlaylist: (playlistId: string, song: Song) => void;
}

type AppStore = PlayerState & PlayerActions & DataState & DataActions;

export const useAppStore = create<AppStore>()(
    persist(
        (set, get) => ({
            // Player State
            currentSong: null,
            currentInfo: null,
            queue: [],
            queueIndex: -1,
            isPlaying: false,
            progress: 0,
            duration: 0,
            volume: 0.8,
            playMode: 'list',
            lyrics: '',
            parsedLyrics: [],
            activeLyricIndex: -1,
            lyricsLoading: false,
            quality: '320k',
            infoError: null,
            sleepEndTime: null,
            savedProgress: 0,

            // Data State
            favorites: [],
            playlists: [],

            // Player Actions
            setCurrentSong: (song) => set({ currentSong: song }),
            setCurrentInfo: (info) => set({ currentInfo: info }),
            setQueue: (queue) => set({ queue }),
            setQueueIndex: (index) => set({ queueIndex: index }),
            setIsPlaying: (playing) => set({ isPlaying: playing }),
            setProgress: (progress) => set({ progress }),
            setDuration: (duration) => set({ duration }),
            setVolume: (volume) => set({ volume }),
            setPlayMode: (mode) => set({ playMode: mode }),
            setLyrics: (lyrics) => set({ lyrics }),
            setParsedLyrics: (lyrics) => set({ parsedLyrics: lyrics }),
            setActiveLyricIndex: (index) => set({ activeLyricIndex: index }),
            setLyricsLoading: (loading) => set({ lyricsLoading: loading }),
            setQuality: (quality) => set({ quality }),
            setInfoError: (error) => set({ infoError: error }),
            setSleepEndTime: (time) => set({ sleepEndTime: time }),

            clearQueue: () => set({ queue: [], queueIndex: -1, currentSong: null }),
            removeFromQueue: (index) => {
                const { queue, queueIndex } = get();
                const newQueue = queue.filter((_, i) => i !== index);
                let newIndex = queueIndex;
                if (index < queueIndex) {
                    newIndex = queueIndex - 1;
                } else if (index === queueIndex) {
                    newIndex = Math.min(queueIndex, newQueue.length - 1);
                }
                set({
                    queue: newQueue,
                    queueIndex: newIndex,
                    currentSong: newQueue[newIndex] || null
                });
            },

            saveProgress: (progress) => set({ savedProgress: progress }),

            // Data Actions
            setFavorites: (favorites) => set({ favorites }),
            setPlaylists: (playlists) => set({ playlists }),

            toggleFavorite: (song) => {
                const { favorites } = get();
                const exists = favorites.some(f => f.id === song.id && f.platform === song.platform);
                if (exists) {
                    set({ favorites: favorites.filter(f => !(f.id === song.id && f.platform === song.platform)) });
                } else {
                    set({ favorites: [...favorites, song] });
                }
            },

            addPlaylist: (playlist) => set(state => ({
                playlists: [playlist, ...state.playlists]
            })),

            updatePlaylist: (id, updates) => set(state => ({
                playlists: state.playlists.map(p => p.id === id ? { ...p, ...updates } : p)
            })),

            deletePlaylist: (id) => set(state => ({
                playlists: state.playlists.filter(p => p.id !== id)
            })),

            toggleSongInPlaylist: (playlistId, song) => {
                const { favorites, playlists } = get();

                if (playlistId === 'favorites') {
                    const exists = favorites.some(f => f.id === song.id && f.platform === song.platform);
                    if (exists) {
                        set({ favorites: favorites.filter(f => !(f.id === song.id && f.platform === song.platform)) });
                    } else {
                        set({ favorites: [...favorites, song] });
                    }
                    return;
                }

                set({
                    playlists: playlists.map(pl => {
                        if (pl.id !== playlistId) return pl;
                        const exists = pl.songs.some(s => s.id === song.id && s.platform === song.platform);
                        if (exists) {
                            return { ...pl, songs: pl.songs.filter(s => !(s.id === song.id && s.platform === song.platform)) };
                        } else {
                            return { ...pl, songs: [...pl.songs, song] };
                        }
                    })
                });
            },
        }),
        {
            name: 'inspire-music-store',
            partialize: (state) => ({
                // Only persist these fields
                currentSong: state.currentSong,
                queue: state.queue,
                queueIndex: state.queueIndex,
                volume: state.volume,
                playMode: state.playMode,
                quality: state.quality,
                favorites: state.favorites,
                playlists: state.playlists,
                savedProgress: state.savedProgress,
            }),
        }
    )
);
