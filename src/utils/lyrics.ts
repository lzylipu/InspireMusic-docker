import type { ParsedLyricLine } from '../types';

/**
 * Parse lyrics into structured array.
 *
 * 支持：
 * - 标准 LRC: [mm:ss.xxx]text
 * - 网易云逐字/逐句格式: [startMs,durationMs](... )字(... )词
 * - 翻译：
 *   - 分段翻译（[翻译]/[translation]）
 *   - QQ 常见同时间戳双行（原文+译文）
 */
export const parseLyrics = (lrc: string): ParsedLyricLine[] => {
    if (!lrc) return [];

    const TIME_TAG_REGEX = /\[(\d{1,2}):(\d{1,2})(?:\.(\d{1,3}))?]/g;
    const NETEASE_LINE_REGEX = /^\[(\d+),(\d+)](.*)$/;
    const OFFSET_REGEX = /^\[offset:(-?\d+)]$/i;
    const TRANSLATION_MARKER_REGEX = /^\[(翻译|翻譯|translation)]$/i;

    const isPlaceholderTranslation = (text: string): boolean => {
        const t = text.trim();
        return t === '' || t === '//' || t === '///' || t === '/';
    };

    const parseTimeTag = (match: RegExpMatchArray, offsetMs: number): number => {
        const mins = Number(match[1]);
        const secs = Number(match[2]);
        const ms = match[3] ? Number(match[3].padEnd(3, '0')) : 0;
        return Math.max(0, mins * 60 + secs + ms / 1000 + offsetMs / 1000);
    };

    type Entry = { time: number; text: string; order: number };

    const lines = lrc.split(/\r?\n/);
    let offsetMs = 0;
    let section: 'main' | 'translation' = 'main';
    let order = 0;
    const mainEntries: Entry[] = [];
    const translationEntries: Entry[] = [];

    for (const rawLine of lines) {
        const line = rawLine.trim();
        if (!line) continue;

        const offsetMatch = line.match(OFFSET_REGEX);
        if (offsetMatch) {
            offsetMs = Number(offsetMatch[1] || 0);
            continue;
        }

        if (TRANSLATION_MARKER_REGEX.test(line)) {
            section = 'translation';
            continue;
        }

        // 网易云逐字歌词：[startMs,durationMs](... )字(... )词
        const neteaseMatch = line.match(NETEASE_LINE_REGEX);
        if (neteaseMatch) {
            const startMs = Number(neteaseMatch[1]);
            const contentRaw = neteaseMatch[3] || '';
            const content = contentRaw
                .replace(/\(\d+,\d+,\d+\)/g, '')
                .replace(/<\d+,\d+,\d+>/g, '')
                .trim();

            if (!content || isPlaceholderTranslation(content)) continue;

            const entry: Entry = {
                time: Math.max(0, (startMs + offsetMs) / 1000),
                text: content,
                order: order++,
            };
            (section === 'translation' ? translationEntries : mainEntries).push(entry);
            continue;
        }

        // 标准 LRC（可能包含多个时间标签）
        TIME_TAG_REGEX.lastIndex = 0;
        const tags = [...line.matchAll(TIME_TAG_REGEX)];
        if (!tags.length) continue;

        TIME_TAG_REGEX.lastIndex = 0;
        const content = line.replace(TIME_TAG_REGEX, '').trim();
        if (!content || isPlaceholderTranslation(content)) continue;

        for (const match of tags) {
            const entry: Entry = {
                time: parseTimeTag(match as RegExpMatchArray, offsetMs),
                text: content,
                order: order++,
            };
            (section === 'translation' ? translationEntries : mainEntries).push(entry);
        }
    }

    // Sort by time, then by original order for stability
    mainEntries.sort((a, b) => a.time - b.time || a.order - b.order);
    translationEntries.sort((a, b) => a.time - b.time || a.order - b.order);

    // Deduplicate exact duplicates (time+text)
    const dedupe = (entries: Entry[]): Entry[] => {
        const seen = new Set<string>();
        const out: Entry[] = [];
        for (const e of entries) {
            const key = `${e.time}|${e.text}`;
            if (seen.has(key)) continue;
            seen.add(key);
            out.push(e);
        }
        return out;
    };

    const main = dedupe(mainEntries);
    const trans = dedupe(translationEntries);

    // Case 1: explicit translation section
    if (trans.length) {
        const TIME_TOLERANCE = 0.5;
        return main.map(({ time, text }) => {
            let bestMatch: string | undefined;
            let bestDiff = TIME_TOLERANCE + 1;

            for (const t of trans) {
                const diff = Math.abs(t.time - time);
                if (diff < bestDiff && diff <= TIME_TOLERANCE) {
                    bestDiff = diff;
                    bestMatch = t.text;
                }
                if (t.time > time + TIME_TOLERANCE) break;
            }

            return { time, text, translation: bestMatch };
        });
    }

    // Case 2: no translation section — try to infer from duplicate timestamps (QQ常见格式)
    const GROUP_TOLERANCE = 0.02; // 20ms
    const results: ParsedLyricLine[] = [];

    let currentGroup: { time: number; items: Entry[] } | null = null;
    const flushGroup = () => {
        if (!currentGroup) return;
        const items = currentGroup.items;
        const uniqueTexts: string[] = [];
        for (const it of items) {
            const t = it.text.trim();
            if (!t || isPlaceholderTranslation(t)) continue;
            if (!uniqueTexts.includes(t)) uniqueTexts.push(t);
        }

        if (!uniqueTexts.length) return;
        if (uniqueTexts.length === 1) {
            results.push({ time: currentGroup.time, text: uniqueTexts[0] });
            return;
        }

        const [mainText, ...rest] = uniqueTexts;
        const translation = rest.length ? rest.join('\n') : undefined;
        results.push({ time: currentGroup.time, text: mainText, translation });
    };

    for (const entry of main) {
        if (!currentGroup) {
            currentGroup = { time: entry.time, items: [entry] };
            continue;
        }

        if (Math.abs(entry.time - currentGroup.time) <= GROUP_TOLERANCE) {
            currentGroup.items.push(entry);
            continue;
        }

        flushGroup();
        currentGroup = { time: entry.time, items: [entry] };
    }
    flushGroup();

    return results;
};

/**
 * Find the active lyric index based on current playback time
 */
export const findActiveLyricIndex = (lyrics: ParsedLyricLine[], currentTime: number): number => {
    if (!lyrics.length) return -1;

    let currentIdx = 0;
    for (let i = 0; i < lyrics.length; i++) {
        if (currentTime >= lyrics[i].time) {
            currentIdx = i;
        } else {
            break;
        }
    }
    return currentIdx;
};
