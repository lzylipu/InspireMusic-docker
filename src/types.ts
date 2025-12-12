export type Platform = 'netease' | 'kuwo' | 'qq';

export type Quality = '128k' | '320k' | 'flac' | 'flac24bit';

export interface Song {
  id: string;
  name: string;
  artist?: string;
  album?: string;
  platform: Platform;
  /** 资源 URL（/api?type=url），可直接用于播放（支持 br 参数） */
  url?: string;
  /** 封面 URL（/api?type=pic 或直链） */
  pic?: string;
  /** 歌词 URL（/api?type=lrc） */
  lrc?: string;
  /** 歌曲详情 URL（/api?type=info） */
  info?: string;
  /** 平台返回的音质列表（不一定有效） */
  types?: string[];
}

export interface SongInfo {
  name: string;
  artist: string;
  album: string;
  url: string;
  pic: string;
  lrc: string;
}

export interface SearchResult {
  keyword: string;
  limit?: number;
  page?: number;
  total?: number;
  results: Song[];
}

export interface PlaylistInfo {
  name: string;
  pic?: string;
  desc?: string;
  author?: string;
  playCount?: number;
}

export interface PlaylistData {
  list: Song[];
  total?: number;
  source?: Platform;
  info?: PlaylistInfo;
}

export interface ToplistSummary {
  id: string;
  name: string;
  pic?: string;
  updateFrequency?: string;
  url?: string;
}

export interface LocalPlaylist {
  id: string;
  name: string;
  songs: Song[];
  source?: Platform;
  origin?: string;
  pic?: string;
  desc?: string;
  url?: string;
}

export type ParsedLyricLine = {
  time: number;
  text: string;
  translation?: string;
};
