import { Minus, Square, X } from 'lucide-react';

// 检测是否在 Tauri 环境中运行
const isTauri = typeof window !== 'undefined' && '__TAURI__' in window;

export const TitleBar: React.FC = () => {
    if (!isTauri) return null;

    const handleMinimize = async () => {
        const { getCurrentWindow } = await import('@tauri-apps/api/window');
        await getCurrentWindow().minimize();
    };

    const handleMaximize = async () => {
        const { getCurrentWindow } = await import('@tauri-apps/api/window');
        const win = getCurrentWindow();
        if (await win.isMaximized()) {
            await win.unmaximize();
        } else {
            await win.maximize();
        }
    };

    const handleClose = async () => {
        const { getCurrentWindow } = await import('@tauri-apps/api/window');
        await getCurrentWindow().close();
    };

    const handleDrag = async (e: React.MouseEvent) => {
        // 只在非按钮区域触发拖拽
        if ((e.target as HTMLElement).closest('button')) return;
        const { getCurrentWindow } = await import('@tauri-apps/api/window');
        await getCurrentWindow().startDragging();
    };

    return (
        <div
            className="h-8 bg-black/80 backdrop-blur-sm flex items-center justify-between select-none shrink-0"
            onMouseDown={handleDrag}
        >
            {/* 左侧：应用标题 */}
            <div className="flex items-center gap-2 px-3">
                <span className="text-xs font-medium text-white/80">InspireMusic</span>
            </div>

            {/* 右侧：窗口控制按钮 */}
            <div className="flex items-center h-full">
                <button
                    onClick={handleMinimize}
                    className="h-full px-4 hover:bg-white/10 transition-colors flex items-center justify-center"
                    title="最小化"
                >
                    <Minus className="w-4 h-4 text-white/70" />
                </button>
                <button
                    onClick={handleMaximize}
                    className="h-full px-4 hover:bg-white/10 transition-colors flex items-center justify-center"
                    title="最大化"
                >
                    <Square className="w-3 h-3 text-white/70" />
                </button>
                <button
                    onClick={handleClose}
                    className="h-full px-4 hover:bg-red-500 transition-colors flex items-center justify-center"
                    title="关闭"
                >
                    <X className="w-4 h-4 text-white/70" />
                </button>
            </div>
        </div>
    );
};
