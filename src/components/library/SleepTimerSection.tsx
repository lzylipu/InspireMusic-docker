import React, { useState, useEffect, useLayoutEffect } from 'react';
import { Timer, Clock, X } from 'lucide-react';

interface SleepTimerSectionProps {
    sleepEndTime: number | null;
    onSetSleepTimer: (minutes: number) => void;
    onCancelSleepTimer: () => void;
}

export const SleepTimerSection: React.FC<SleepTimerSectionProps> = ({
    sleepEndTime,
    onSetSleepTimer,
    onCancelSleepTimer,
}) => {
    const [customTimer, setCustomTimer] = useState('');
    const [showCustomTimer, setShowCustomTimer] = useState(false);
    const [timeLeft, setTimeLeft] = useState<string>('');

    // Use useLayoutEffect to reset timeLeft synchronously when sleepEndTime is null
    /* eslint-disable react-hooks/set-state-in-effect -- Intentional: sync derived state when sleepEndTime prop changes */
    useLayoutEffect(() => {
        if (!sleepEndTime) {
            setTimeLeft('');
        }
    }, [sleepEndTime]);
    /* eslint-enable react-hooks/set-state-in-effect */

    useEffect(() => {
        if (!sleepEndTime) {
            return;
        }

        const updateTimer = () => {
            const now = Date.now();
            const diff = Math.max(0, Math.ceil((sleepEndTime - now) / 1000));

            if (diff <= 0) {
                setTimeLeft('00:00');
            } else {
                const mins = Math.floor(diff / 60);
                const secs = diff % 60;
                setTimeLeft(`${mins}:${secs.toString().padStart(2, '0')}`);
            }
        };

        updateTimer();
        const interval = setInterval(updateTimer, 1000);
        return () => clearInterval(interval);
    }, [sleepEndTime]);

    const handleCustomTimerSubmit = () => {
        const mins = parseInt(customTimer);
        if (!isNaN(mins) && mins > 0 && mins <= 180) {
            onSetSleepTimer(mins);
            setShowCustomTimer(false);
            setCustomTimer('');
        }
    };

    return (
        <div>
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <Timer size={20} />
                定时关闭
            </h3>

            {sleepEndTime ? (
                <div className="flex items-center gap-4 bg-primary/10 border border-primary/20 rounded-lg p-3">
                    <Clock size={20} className="text-primary" />
                    <div className="flex-1">
                        <div className="text-white font-medium">定时已开启</div>
                        <div className="text-primary font-mono text-xl font-bold">{timeLeft}</div>
                    </div>
                    <button
                        onClick={onCancelSleepTimer}
                        className="p-2 hover:bg-white/10 rounded-full text-gray-400 hover:text-white transition-colors"
                        title="取消定时"
                    >
                        <X size={20} />
                    </button>
                </div>
            ) : (
                <div className="flex flex-wrap gap-2">
                    {[15, 30, 60].map((min) => (
                        <button
                            key={min}
                            onClick={() => onSetSleepTimer(min)}
                            className="px-3 py-1.5 bg-black/20 hover:bg-black/40 text-gray-300 hover:text-white rounded text-sm transition-colors border border-transparent hover:border-gray-700"
                        >
                            {min}分钟
                        </button>
                    ))}

                    {showCustomTimer ? (
                        <div className="flex items-center gap-2">
                            <input
                                type="number"
                                min="1"
                                max="180"
                                placeholder="分钟"
                                value={customTimer}
                                onChange={(e) => setCustomTimer(e.target.value)}
                                className="w-20 bg-black/20 text-white text-sm px-2 py-1.5 rounded outline-none border border-primary/50"
                                autoFocus
                                onKeyDown={(e) => e.key === 'Enter' && handleCustomTimerSubmit()}
                            />
                            <button
                                onClick={handleCustomTimerSubmit}
                                className="text-primary hover:text-primary/80 text-sm font-medium"
                            >
                                确定
                            </button>
                            <button
                                onClick={() => setShowCustomTimer(false)}
                                className="text-gray-400 hover:text-white text-sm"
                            >
                                取消
                            </button>
                        </div>
                    ) : (
                        <button
                            onClick={() => setShowCustomTimer(true)}
                            className="px-3 py-1.5 bg-black/20 hover:bg-black/40 text-gray-300 hover:text-white rounded text-sm transition-colors border border-transparent hover:border-gray-700"
                        >
                            自定义
                        </button>
                    )}
                </div>
            )}
        </div>
    );
};
