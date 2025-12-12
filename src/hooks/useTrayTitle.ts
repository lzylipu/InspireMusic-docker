import { useEffect } from 'react';

// 检测是否在 Tauri 环境中运行
const isTauri = typeof window !== 'undefined' && '__TAURI__' in window;

/**
 * 更新系统托盘的提示文字
 * @param songName 当前播放的歌曲名
 * @param artist 艺术家名
 */
export function useTrayTitle(songName?: string, artist?: string) {
    useEffect(() => {
        if (!isTauri) return;

        const updateTray = async () => {
            try {
                const { invoke } = await import('@tauri-apps/api/core');
                const title = songName
                    ? artist
                        ? `${songName} - ${artist}`
                        : songName
                    : 'InspireMusic';
                await invoke('update_tray_title', { title });
            } catch {
                // 忽略错误（可能不在 Tauri 环境）
            }
        };

        updateTray();
    }, [songName, artist]);
}
