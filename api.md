# TuneHub API 文档（统一音乐解析服务）

TuneHub 提供一套统一的 HTTP API，用于在多个音乐平台之间获取歌曲元数据、播放链接、封面、歌词，以及搜索、歌单与排行榜信息。

> 说明：本文档仅描述当前已暴露的接口与行为（含 302 跳转与自动换源响应头）。不同平台返回的字段细节可能存在差异，以实际响应为准。

## 1. 基本信息

- Base URL：`https://music-dl.sayqz.com`
- API 版本：`1.0.0`
- 统一入口：`/api/`（全部接口均通过查询参数 `type` 区分）

## 2. 支持平台

| source | 平台名称 | 状态 |
|---|---|---|
| netease | 网易云音乐 | ✅ 已启用 |
| kuwo | 酷我音乐 | ✅ 已启用 |
| qq | QQ音乐 | ✅ 已启用 |

## 3. 通用约定

### 3.1 请求方式

- 统一使用 `GET`。
- 参数通过 QueryString 传递。
- `keyword` 需要进行 URL 编码（例如中文关键词）。

### 3.2 返回结构（JSON 接口）

除 `type=url/pic`（302 跳转）与 `type=lrc`（纯文本）外，其余接口返回 JSON，结构通常为：

```json
{
  "code": 200,
  "message": "success",
  "data": {},
  "timestamp": "2025-12-13T02:55:24.738+08:00"
}
```

字段说明：

- `code`：状态码（示例中 `200` 表示成功）
- `message`：状态信息（示例为 `success`）
- `data`：业务数据
- `timestamp`：服务端时间戳（字符串）

### 3.3 302 跳转类接口

以下接口不会返回 JSON，而是直接返回 `302 Redirect`：

- `type=url`：音乐文件真实地址
- `type=pic`：封面图片真实地址

客户端建议：

- 浏览器/播放器可直接跟随重定向。
- 若需要拿到最终 URL，可关闭自动跟随重定向并读取 `Location` 头。

### 3.4 自动换源

当指定平台请求失败时，服务可能自动尝试其它平台进行兜底。

- 若发生换源，响应头将包含：`X-Source-Switch`（例如：`netease -> kuwo`）。

### 3.5 分页参数

搜索相关接口支持分页：

- `limit`：每页数量（示例：`20`）
- `page`：页码（从 `1` 开始）

### 3.6 音质参数（br）

仅 `type=url` 使用：

| br | 说明 | 参考比特率 |
|---|---|---|
| 128k | 标准音质 | 128kbps |
| 320k | 高品质 | 320kbps |
| flac | 无损音质 | ~1000kbps |
| flac24bit | Hi-Res | ~1400kbps |

> 备注：部分接口响应中的 `types` 列表不一定代表“必定可用”，实际以你发起的 `br` 请求为准。

## 4. 接口一览

所有接口均为 `GET /api/`，通过 `type` 区分能力：

- `type=info`：获取歌曲基本信息
- `type=url`：获取音乐文件（302）
- `type=pic`：获取封面（302）
- `type=lrc`：获取歌词（文本）
- `type=search`：单平台搜索
- `type=aggregateSearch`：跨平台聚合搜索
- `type=playlist`：歌单详情
- `type=toplists`：排行榜列表
- `type=toplist`：排行榜歌曲

## 5. 详细接口

### 5.1 获取歌曲基本信息（info）

**GET** `/api/?source={source}&id={id}&type=info`

参数：

| 参数 | 必填 | 说明 |
|---|---:|---|
| source | 是 | 平台标识：`netease` / `kuwo` / `qq` |
| id | 是 | 歌曲 ID（各平台格式不同） |
| type | 是 | 固定为 `info` |

响应：JSON（返回歌曲元数据与相关资源入口 URL）

示例（netease `1469825684`）：

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "name": "燕无歇",
    "artist": "蒋雪儿Snow.J",
    "album": "燕无歇",
    "url": "https://music-dl.sayqz.com/api/?source=netease&id=1469825684&type=url",
    "pic": "https://music-dl.sayqz.com/api/?source=netease&id=1469825684&type=pic",
    "lrc": "https://music-dl.sayqz.com/api/?source=netease&id=1469825684&type=lrc"
  },
  "timestamp": "2025-12-13T02:55:24.738+08:00"
}
```

### 5.2 获取音乐文件链接（url，302）

**GET** `/api/?source={source}&id={id}&type=url&br={br}`

参数：

| 参数 | 必填 | 说明 |
|---|---:|---|
| source | 是 | 平台标识 |
| id | 是 | 歌曲 ID |
| type | 是 | 固定为 `url` |
| br | 否 | 音质：`128k` / `320k` / `flac` / `flac24bit`（默认行为以服务端为准） |

响应：`302 Redirect` 到真实音乐文件地址。

补充：若触发自动换源，响应头包含 `X-Source-Switch`。

### 5.3 获取专辑封面（pic，302）

**GET** `/api/?source={source}&id={id}&type=pic`

参数：

| 参数 | 必填 | 说明 |
|---|---:|---|
| source | 是 | 平台标识 |
| id | 是 | 歌曲 ID |
| type | 是 | 固定为 `pic` |

响应：`302 Redirect` 到图片地址。

### 5.4 获取歌词（lrc，文本）

**GET** `/api/?source={source}&id={id}&type=lrc`

参数：

| 参数 | 必填 | 说明 |
|---|---:|---|
| source | 是 | 平台标识 |
| id | 是 | 歌曲 ID |
| type | 是 | 固定为 `lrc` |

响应：`text/plain`（LRC/变体格式，不同平台可能不同）。

歌词格式示例（节选）：

```lyric
// 网易云（可能包含逐字时间戳）
[00:00.00]作词: 堇临 / 刘涛
[00:00.14]作曲: 刘涛
[289,5376](289,245,0)只(534,330,0)叹(864,1060,0)她(1924,390,0)回(2314,789,0)眸(3297,107,0)秋(3404,510,0)水(3914,510,0)被(4424,791,0)隐(5217,448,0)去

// 酷我（常见字段头 + 常规时间戳）
[ver:v1.0]
[ti:燕无歇]
[ar:是七叔呢]
[al:燕无歇]
[offset:0]
[00:00.000]燕无歇 - 是七叔呢
[00:00.120]词 Lyrics：堇临/刘昊霖
[00:00.240]曲 Music：刘昊霖

// QQ（常规 LRC，部分歌曲可能含翻译扩展格式，注意：时间戳可能不会严格对齐）
[00:00.29]翼をください - 林原惠美 (林原めぐみ)
[00:03.57]词：山上路夫
[00:04.85]曲：村井邦彦
[00:14.17]今 私の願いごとが
[00:27.38]かなうならば 翼がほしい
...

[翻译]
[00:00.29]//
[00:03.57]//
[00:04.85]//
[00:14.17]此刻 我许下心愿
[00:27.39]如果可以实现 我想要一双翅膀
...
```

### 5.5 单平台搜索（search）

**GET** `/api/?source={source}&type=search&keyword={keyword}&limit={limit}&page={page}`

参数：

| 参数 | 必填 | 说明 |
|---|---:|---|
| source | 是 | 平台标识 |
| type | 是 | 固定为 `search` |
| keyword | 是 | 关键词（需要 URL 编码） |
| limit | 否 | 每页数量（示例：`20`） |
| page | 否 | 页码（示例：`1`） |

响应：JSON（结果列表通常包含 `id/name/artist/album/url/pic/lrc/platform`）

示例（节选）：

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "keyword": "燕无歇",
    "limit": 20,
    "page": 1,
    "total": 20,
    "results": [
      {
        "id": "1469825684",
        "name": "燕无歇",
        "artist": "蒋雪儿Snow.J",
        "album": "燕无歇",
        "url": "https://music-dl.sayqz.com/api/?source=netease&id=1469825684&type=url",
        "pic": "https://music-dl.sayqz.com/api/?source=netease&id=1469825684&type=pic",
        "lrc": "https://music-dl.sayqz.com/api/?source=netease&id=1469825684&type=lrc",
        "platform": "netease"
      }
    ]
  },
  "timestamp": "2025-12-13T02:52:27.010+08:00"
}
```

### 5.6 聚合搜索（aggregateSearch）

**GET** `/api/?type=aggregateSearch&keyword={keyword}&limit={limit}&page={page}`

参数：

| 参数 | 必填 | 说明 |
|---|---:|---|
| type | 是 | 固定为 `aggregateSearch` |
| keyword | 是 | 关键词（需要 URL 编码） |
| limit | 否 | 每页数量 |
| page | 否 | 页码 |

响应：JSON（聚合多个平台结果，并给出各平台耗时/统计）

示例（节选）：

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "keyword": "燕无歇",
    "limit": 10,
    "page": 1,
    "platforms": ["kuwo", "netease", "qq"],
    "platformStats": {
      "kuwo": { "success": true, "count": 10, "duration": 242, "error": null },
      "netease": { "success": true, "count": 10, "duration": 175, "error": null },
      "qq": { "success": true, "count": 10, "duration": 305, "error": null }
    },
    "total": 30,
    "results": [
      {
        "id": "153558939",
        "name": "燕无歇",
        "artist": "七叔（叶泽浩）",
        "album": "燕无歇",
        "url": "https://music-dl.sayqz.com/api/?source=kuwo&id=153558939&type=url",
        "pic": "https://music-dl.sayqz.com/api/?source=kuwo&id=153558939&type=pic",
        "lrc": "https://music-dl.sayqz.com/api/?source=kuwo&id=153558939&type=lrc",
        "platform": "kuwo"
      }
    ]
  },
  "timestamp": "2025-12-13T02:54:10.850+08:00"
}
```

## 6. 歌单与排行榜

### 6.1 获取歌单详情（playlist）

**GET** `/api/?source={source}&id={id}&type=playlist`

参数：

| 参数 | 必填 | 说明 |
|---|---:|---|
| source | 是 | 平台标识 |
| id | 是 | 歌单 ID |
| type | 是 | 固定为 `playlist` |

响应：JSON（歌单信息 + 歌曲列表）

示例（节选，已补全 JSON 结构）：

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "list": [
      {
        "id": "002Tl6F42Gj23P",
        "name": "優しさの結晶",
        "artist": "忍",
        "album": "アストラエアの白き永遠 オリジナルサウンドトラック プラス",
        "info": "https://music-dl.sayqz.com/api/?source=qq&id=002Tl6F42Gj23P&type=info",
        "url": "https://music-dl.sayqz.com/api/?source=qq&id=002Tl6F42Gj23P&type=url",
        "pic": "https://music-dl.sayqz.com/api/?source=qq&id=002Tl6F42Gj23P&type=pic",
        "lrc": "https://music-dl.sayqz.com/api/?source=qq&id=002Tl6F42Gj23P&type=lrc",
        "types": ["128k", "320k", "flac"]
      }
    ],
    "total": 89,
    "source": "qq",
    "info": {
      "name": "平台歌单名",
      "pic": "http://y.gtimg.cn/music/photo_new/1234567.jpg?n=1",
      "desc": "",
      "author": "平台用户名",
      "playCount": 0
    }
  },
  "timestamp": "2025-12-13T03:04:32.352+08:00"
}
```

### 6.2 获取排行榜列表（toplists）

**GET** `/api/?source={source}&type=toplists`

参数：

| 参数 | 必填 | 说明 |
|---|---:|---|
| source | 是 | 平台标识 |
| type | 是 | 固定为 `toplists` |

响应：JSON（排行榜集合，通常包含榜单 `id/name/pic/updateFrequency/url`）

示例（节选）：

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "list": [
      {
        "id": "19723756",
        "name": "飙升榜",
        "pic": "https://p1.music.126.net/rIi7Qzy2i2Y_1QD7cd0MYA==/109951170048506929.jpg",
        "updateFrequency": "每天更新",
        "url": "https://music-dl.sayqz.com/api/?source=netease&id=19723756&type=toplist"
      }
    ],
    "total": 62,
    "source": "netease"
  },
  "timestamp": "2025-12-13T03:06:50.114+08:00"
}
```

### 6.3 获取排行榜歌曲（toplist）

**GET** `/api/?source={source}&id={id}&type=toplist`

参数：

| 参数 | 必填 | 说明 |
|---|---:|---|
| source | 是 | 平台标识 |
| id | 是 | 榜单 ID |
| type | 是 | 固定为 `toplist` |

响应：JSON（榜单歌曲列表）

示例（节选）：

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "list": [
      {
        "id": "2026800618",
        "name": "Die For You (Remix Acapella)",
        "artist": "The Weeknd、Ariana Grande",
        "album": "Die For You (Remix Acapella)",
        "info": "https://music-dl.sayqz.com/api/?source=netease&id=2026800618&type=info",
        "url": "https://music-dl.sayqz.com/api/?source=netease&id=2026800618&type=url",
        "pic": "https://music-dl.sayqz.com/api/?source=netease&id=2026800618&type=pic",
        "lrc": "https://music-dl.sayqz.com/api/?source=netease&id=2026800618&type=lrc",
        "types": ["flac", "320k", "128k"]
      }
    ],
    "total": 100,
    "source": "netease"
  },
  "timestamp": "2025-12-13T03:07:35.658+08:00"
}
```
