/**
 * Разбор ссылок YouTube.
 *
 * Админ вставляет ссылку в том виде, в каком скопировал её из браузера или из
 * кнопки «Поделиться». Форматов много, поэтому нормализуем их в один videoId,
 * по которому строим плеер и превью:
 *   https://www.youtube.com/watch?v=ID
 *   https://youtu.be/ID
 *   https://www.youtube.com/shorts/ID
 *   https://www.youtube.com/embed/ID
 *   https://www.youtube.com/live/ID
 *   https://m.youtube.com/watch?v=ID&t=30s
 * Также принимаем «голый» ID, если он вставлен без ссылки.
 */

/** ID видео на YouTube — ровно 11 символов из безопасного base64-алфавита. */
const VIDEO_ID_RE = /^[a-zA-Z0-9_-]{11}$/;

const ALLOWED_HOSTS = new Set([
  "youtube.com",
  "www.youtube.com",
  "m.youtube.com",
  "music.youtube.com",
  "youtube-nocookie.com",
  "www.youtube-nocookie.com",
  "youtu.be",
  "www.youtu.be",
]);

/** Пути, после которых идёт сам ID: /embed/ID, /shorts/ID, /live/ID, /v/ID. */
const PATH_PREFIXES = ["embed", "shorts", "live", "v", "e"];

/**
 * Возвращает videoId или null, если ссылка не похожа на видео YouTube.
 * Никогда не бросает исключений — вызывающий код просто показывает ошибку валидации.
 */
export function extractYouTubeId(input: string): string | null {
  const raw = (input || "").trim();
  if (!raw) return null;

  // Уже готовый ID.
  if (VIDEO_ID_RE.test(raw)) return raw;

  // URL может быть вставлен без схемы («youtu.be/ID»), тогда конструктор URL
  // не справится — добавляем https:// перед разбором.
  const withScheme = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;

  let url: URL;
  try {
    url = new URL(withScheme);
  } catch {
    return null;
  }

  const host = url.hostname.toLowerCase();
  if (!ALLOWED_HOSTS.has(host)) return null;

  // youtu.be/ID — ID лежит прямо в первом сегменте пути.
  if (host.endsWith("youtu.be")) {
    const id = url.pathname.split("/").filter(Boolean)[0] || "";
    return VIDEO_ID_RE.test(id) ? id : null;
  }

  // watch?v=ID — основной формат.
  const fromQuery = url.searchParams.get("v");
  if (fromQuery && VIDEO_ID_RE.test(fromQuery)) return fromQuery;

  const segments = url.pathname.split("/").filter(Boolean);
  if (segments.length >= 2 && PATH_PREFIXES.includes(segments[0].toLowerCase())) {
    const id = segments[1];
    return VIDEO_ID_RE.test(id) ? id : null;
  }

  return null;
}

/** Ссылка на страницу видео — используем в админке и в подписи «Смотреть на YouTube». */
export function youtubeWatchUrl(videoId: string): string {
  return `https://www.youtube.com/watch?v=${videoId}`;
}

/**
 * Ссылка на плеер. Берём домен youtube-nocookie.com: он не ставит рекламные
 * cookie до старта просмотра, что заметно дружелюбнее к требованиям 152-ФЗ и
 * не мешает нашей аналитике.
 */
export function youtubeEmbedUrl(videoId: string): string {
  return `https://www.youtube-nocookie.com/embed/${videoId}?rel=0&modestbranding=1`;
}

/**
 * Превью-картинка. hqdefault существует у всех видео (в отличие от maxresdefault,
 * которого нет у старых и у части Shorts), поэтому «битых» картинок не будет.
 */
export function youtubeThumbnailUrl(videoId: string): string {
  return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
}
