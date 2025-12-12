import type {
  Platform,
  PlaylistData,
  Quality,
  SearchResult,
  Song,
  SongInfo,
  ToplistSummary,
} from './types';
import {
  CACHE_TTL,
  generateCacheKey,
  getFromCache,
  saveToCache,
} from './utils/cache';

const BASE_URL = 'https://music-dl.sayqz.com';

const handleResponse = async <T>(response: Response): Promise<T> => {
  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Request failed with ${response.status}`);
  }
  return response.json() as Promise<T>;
};

const fetchText = async (url: string): Promise<string> => {
  const response = await fetch(url);
  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Request failed with ${response.status}`);
  }
  return response.text();
};

const buildPath = (params: Record<string, string | number | undefined>): string => {
  const query = Object.entries(params)
    .filter(([, value]) => value !== undefined && value !== '')
    .map(([key, value]) => `${key}=${encodeURIComponent(String(value))}`)
    .join('&');
  return `/api/?${query}`;
};

export const buildFileUrl = (
  source: Platform,
  id: string,
  type: 'url' | 'pic' | 'lrc',
  quality?: Quality,
): string => {
  const query: Record<string, string> = { source, id, type };
  if (type === 'url' && quality) {
    query.br = quality;
  }
  const path = buildPath(query);
  return `${BASE_URL}${path}`;
};

export const searchSongs = async (
  source: Platform,
  keyword: string,
  limit = 30,
  page = 1,
): Promise<SearchResult> => {
  // 检查缓存（搜索结果短期缓存）
  const cacheKey = generateCacheKey('search', source, keyword, limit, page);
  const cached = getFromCache<SearchResult>(cacheKey);
  if (cached) {
    return cached;
  }

  const path = buildPath({ source, type: 'search', keyword, limit, page });
  const data = await handleResponse<{
    code: number;
    data: { keyword: string; limit?: number; page?: number; total?: number; results: Song[] };
  }>(await fetch(`${BASE_URL}${path}`));
  const result = {
    keyword: data.data.keyword,
    limit: data.data.limit,
    page: data.data.page,
    total: data.data.total,
    results: (data.data.results || []).map((item) => ({
      ...item,
      platform: item.platform || source,
    })),
  };
  
  // 保存到缓存
  saveToCache(cacheKey, result, CACHE_TTL.SEARCH);
  return result;
};

export const aggregateSearch = async (keyword: string, limit = 10, page = 1): Promise<SearchResult> => {
  // 检查缓存
  const cacheKey = generateCacheKey('aggsearch', keyword, limit, page);
  const cached = getFromCache<SearchResult>(cacheKey);
  if (cached) {
    return cached;
  }

  const path = buildPath({ type: 'aggregateSearch', keyword, limit, page });
  const data = await handleResponse<{
    code: number;
    data: { keyword: string; limit?: number; page?: number; total?: number; results: Song[] };
  }>(await fetch(`${BASE_URL}${path}`));
  const result = {
    keyword: data.data.keyword,
    limit: data.data.limit,
    page: data.data.page,
    total: data.data.total,
    results: (data.data.results || []).map((item) => ({
      ...item,
      platform: item.platform || 'netease',
    })),
  };
  
  // 保存到缓存
  saveToCache(cacheKey, result, CACHE_TTL.SEARCH);
  return result;
};

export const getSongInfo = async (source: Platform, id: string): Promise<SongInfo> => {
  // 检查缓存
  const cacheKey = generateCacheKey('songinfo', source, id);
  const cached = getFromCache<SongInfo>(cacheKey);
  if (cached) {
    return cached;
  }

  const path = buildPath({ source, id, type: 'info' });
  const data = await handleResponse<{ code: number; data: SongInfo }>(
    await fetch(`${BASE_URL}${path}`),
  );
  
  // 保存到缓存
  saveToCache(cacheKey, data.data, CACHE_TTL.SONG_INFO);
  return data.data;
};

export const getLyrics = async (source: Platform, id: string, lrcUrl?: string): Promise<string> => {
  // 检查缓存
  const cacheKey = generateCacheKey('lyrics', source, id);
  const cached = getFromCache<string>(cacheKey);
  if (cached) {
    return cached;
  }

  const path = buildPath({ source, id, type: 'lrc' });
  const lyrics = await fetchText(lrcUrl || `${BASE_URL}${path}`);
  
  // 保存到缓存（歌词缓存7天）
  saveToCache(cacheKey, lyrics, CACHE_TTL.LYRICS);
  return lyrics;
};

export const getPlaylist = async (source: Platform, id: string): Promise<PlaylistData> => {
  // 检查缓存
  const cacheKey = generateCacheKey('playlist', source, id);
  const cached = getFromCache<PlaylistData>(cacheKey);
  if (cached) {
    return cached;
  }

  const path = buildPath({ source, id, type: 'playlist' });
  const data = await handleResponse<{ code: number; data: PlaylistData }>(
    await fetch(`${BASE_URL}${path}`),
  );
  const result = {
    ...data.data,
    list: (data.data.list || []).map((item) => ({ ...item, platform: source })),
  };
  
  // 保存到缓存
  saveToCache(cacheKey, result, CACHE_TTL.PLAYLIST);
  return result;
};

export const getToplists = async (source: Platform): Promise<ToplistSummary[]> => {
  // 检查缓存
  const cacheKey = generateCacheKey('toplists', source);
  const cached = getFromCache<ToplistSummary[]>(cacheKey);
  if (cached) {
    return cached;
  }

  const path = buildPath({ source, type: 'toplists' });
  const data = await handleResponse<{ code: number; data: { list: ToplistSummary[] } }>(
    await fetch(`${BASE_URL}${path}`),
  );
  const result = data.data.list || [];
  
  // 保存到缓存
  saveToCache(cacheKey, result, CACHE_TTL.TOPLISTS);
  return result;
};

export const getToplistSongs = async (
  source: Platform,
  id: string,
): Promise<{ list: Song[]; source: Platform }> => {
  // 检查缓存
  const cacheKey = generateCacheKey('toplistsongs', source, id);
  const cached = getFromCache<{ list: Song[]; source: Platform }>(cacheKey);
  if (cached) {
    return cached;
  }

  const path = buildPath({ source, id, type: 'toplist' });
  const data = await handleResponse<{ code: number; data: { list: Song[]; source: Platform } }>(
    await fetch(`${BASE_URL}${path}`),
  );
  const result = {
    source: data.data.source || source,
    list: (data.data.list || []).map((item) => ({ ...item, platform: data.data.source || source })),
  };
  
  // 保存到缓存
  saveToCache(cacheKey, result, CACHE_TTL.TOPLIST_SONGS);
  return result;
};

// 重新导出缓存管理函数供外部使用
export { clearAllCache, getCacheStats, cleanupExpiredCache } from './utils/cache';
