"use client";

import { useState } from "react";

export interface ProductVideoItem {
  id: string;
  title: string;
  description: string;
  videoId: string;
}

interface ProductVideosProps {
  videos: ProductVideoItem[];
}

/**
 * Видео о товаре (YouTube) в карточке товара — блок над отзывами.
 *
 * iframe подгружается только после клика по превью (facade / lazy-load).
 * Причина — плеер YouTube тянет более мегабайта скриптов на каждый ролик и
 * заметно роняет LCP/INP карточки товара, а карточка — ключевая SEO-страница.
 */
export default function ProductVideos({ videos }: ProductVideosProps) {
  // id видео, для которых пользователь нажал «воспроизвести».
  const [playing, setPlaying] = useState<Set<string>>(new Set());

  if (videos.length === 0) return null;

  const play = (id: string) => {
    setPlaying((prev) => new Set(prev).add(id));
  };

  return (
    <div className="mt-12">
      <div className="flex items-center gap-3 mb-4 sm:mb-6">
        <h2 className="text-xl font-bold text-text-dark">Видео о товаре</h2>
        <span className="text-sm text-text-gray">({videos.length})</span>
      </div>

      <div className={`grid gap-4 ${videos.length === 1 ? "grid-cols-1 max-w-2xl" : "grid-cols-1 sm:grid-cols-2"}`}>
        {videos.map((video) => {
          const isPlaying = playing.has(video.id);
          return (
            <div key={video.id} className="bg-bg-white rounded-xl border border-border overflow-hidden">
              <div className="relative w-full aspect-video bg-black">
                {isPlaying ? (
                  <iframe
                    src={`https://www.youtube-nocookie.com/embed/${video.videoId}?autoplay=1&rel=0&modestbranding=1`}
                    title={video.title || "Видео о товаре"}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                    loading="lazy"
                    className="absolute inset-0 w-full h-full"
                  />
                ) : (
                  <button
                    type="button"
                    onClick={() => play(video.id)}
                    aria-label={`Смотреть видео: ${video.title || "видео о товаре"}`}
                    className="group absolute inset-0 w-full h-full cursor-pointer"
                  >
                    {/* Превью грузим через обычный img: домен img.youtube.com не нужно
                        регистрировать в next.config и оно не требует оптимизации на сервере. */}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={`https://img.youtube.com/vi/${video.videoId}/hqdefault.jpg`}
                      alt={video.title || "Видео о товаре"}
                      loading="lazy"
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                    <span className="absolute inset-0 bg-black/20 group-hover:bg-black/30 transition-colors" />
                    <span className="absolute inset-0 flex items-center justify-center">
                      <span className="flex items-center justify-center w-16 h-11 rounded-xl bg-[#FF0000] group-hover:scale-110 transition-transform shadow-lg">
                        <svg className="w-6 h-6 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M8 5v14l11-7z" />
                        </svg>
                      </span>
                    </span>
                  </button>
                )}
              </div>

              {(video.title || video.description) && (
                <div className="p-4">
                  {video.title && <h3 className="font-medium text-text-dark text-sm mb-1">{video.title}</h3>}
                  {video.description && (
                    <p className="text-sm text-text-gray leading-relaxed whitespace-pre-line">{video.description}</p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
