"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { QueueItem } from "@/lib/queue";

// YouTube IFrame API types
interface YTPlayer {
  playVideo: () => void;
  destroy: () => void;
}

interface YTPlayerEvent {
  target: YTPlayer;
  data: number;
}

declare global {
  interface Window {
    YT: {
      Player: new (
        el: string | HTMLElement,
        config: Record<string, unknown>
      ) => YTPlayer;
      PlayerState: { ENDED: number };
    };
    onYouTubeIframeAPIReady: () => void;
  }
}

function loadYouTubeAPI(): Promise<void> {
  return new Promise((resolve) => {
    if (window.YT) {
      resolve();
      return;
    }
    window.onYouTubeIframeAPIReady = () => resolve();
    const tag = document.createElement("script");
    tag.src = "https://www.youtube.com/iframe_api";
    document.head.appendChild(tag);
  });
}

export default function PlayerPage() {
  const [current, setCurrent] = useState<QueueItem | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [totalSongs, setTotalSongs] = useState(0);
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [embedError, setEmbedError] = useState(false);
  const playerRef = useRef<YTPlayer | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  // Track the video ID we're currently showing to avoid re-creating player needlessly
  const activeVideoIdRef = useRef<string | null>(null);

  const fetchCurrent = useCallback(async () => {
    try {
      const res = await fetch("/api/queue/current");
      const data = await res.json();
      setCurrent(data.current);
      setCurrentIndex(data.currentIndex);
      setTotalSongs(data.totalSongs);
    } catch (err) {
      console.error("Failed to fetch current song:", err);
    }
  }, []);

  const fetchQueue = useCallback(async () => {
    try {
      const res = await fetch("/api/queue");
      const data = await res.json();
      setQueue(data.queue);
    } catch (err) {
      console.error("Failed to fetch queue:", err);
    }
  }, []);

  const advanceToNext = useCallback(async () => {
    try {
      const res = await fetch("/api/queue/next", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      setCurrent(data.current);
      setCurrentIndex(data.currentIndex);
      setTotalSongs(data.totalSongs);
      fetchQueue();
    } catch (err) {
      console.error("Failed to advance:", err);
    }
  }, [fetchQueue]);

  // Create / recreate the YouTube player when the current song changes
  useEffect(() => {
    if (!current) {
      activeVideoIdRef.current = null;
      return;
    }
    if (current.videoId === activeVideoIdRef.current) return;
    activeVideoIdRef.current = current.videoId;
    setEmbedError(false);

    let cancelled = false;

    (async () => {
      await loadYouTubeAPI();
      if (cancelled) return;

      // Destroy previous player
      if (playerRef.current) {
        try { playerRef.current.destroy(); } catch { /* ignore */ }
        playerRef.current = null;
      }

      // Clear the container so YT can inject a fresh iframe
      if (containerRef.current) {
        containerRef.current.innerHTML = '<div id="yt-player"></div>';
      }

      playerRef.current = new window.YT.Player("yt-player", {
        videoId: current.videoId,
        width: "100%",
        height: "100%",
        playerVars: {
          autoplay: 1,
          controls: 1,
          modestbranding: 1,
          rel: 0,
          fs: 1,
        },
        events: {
          onReady: (e: YTPlayerEvent) => {
            e.target.playVideo();
          },
          onStateChange: (e: YTPlayerEvent) => {
            // ENDED = 0
            if (e.data === 0) {
              advanceToNext();
            }
          },
          onError: () => {
            if (!cancelled) setEmbedError(true);
          },
        },
      } as unknown as Record<string, unknown>);
    })();

    return () => {
      cancelled = true;
    };
  }, [current, advanceToNext]);

  // Polling
  useEffect(() => {
    fetchCurrent();
    fetchQueue();
    const interval = setInterval(() => {
      fetchCurrent();
      fetchQueue();
    }, 3000);
    return () => clearInterval(interval);
  }, [fetchCurrent, fetchQueue]);

  const handleSkip = () => advanceToNext();

  const handleOpenOnYouTube = () => {
    if (current) {
      window.open(`https://www.youtube.com/watch?v=${current.videoId}`, "_blank");
    }
  };

  // Next song in queue (for "up next" display)
  const nextSong = queue.length > currentIndex + 1 ? queue[currentIndex + 1] : null;

  return (
    <div className="h-screen w-screen bg-black text-white flex flex-col overflow-hidden">
      {/* Video area */}
      <div className="flex-1 relative flex items-center justify-center">
        {current ? (
          <>
            <div
              ref={containerRef}
              className="absolute inset-0 [&_iframe]:w-full [&_iframe]:h-full"
            >
              <div id="yt-player" />
            </div>

            {embedError && (
              <div className="absolute inset-0 bg-black/90 flex items-center justify-center z-10">
                <div className="text-center space-y-4 px-6">
                  <p className="text-2xl font-bold text-red-400">
                    Embedding disabled for this video
                  </p>
                  <p className="text-gray-400">
                    The video owner doesn&apos;t allow playback on other sites.
                  </p>
                  <div className="flex gap-3 justify-center flex-wrap">
                    <button
                      onClick={handleOpenOnYouTube}
                      className="px-5 py-2 bg-red-600 hover:bg-red-700 rounded-lg font-semibold transition-colors"
                    >
                      Watch on YouTube
                    </button>
                    <button
                      onClick={handleSkip}
                      className="px-5 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg font-semibold transition-colors"
                    >
                      Skip to Next
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="text-center">
            <h2 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent mb-4">
              Karaoke Party
            </h2>
            <p className="text-gray-400 text-xl">
              {totalSongs === 0
                ? "No songs in the queue. Add songs to get started!"
                : "All songs have been played!"}
            </p>
          </div>
        )}
      </div>

      {/* Bottom bar */}
      <div className="bg-gray-900/95 backdrop-blur-sm border-t border-gray-800 px-6 py-3 flex items-center justify-between">
        <div className="flex-1 min-w-0">
          {current && (
            <div>
              <p className="text-white font-semibold truncate">{current.title}</p>
              <p className="text-purple-400 text-sm">Singing: {current.singer}</p>
            </div>
          )}
        </div>

        <div className="flex items-center gap-4 flex-shrink-0">
          {current && (
            <button
              onClick={handleSkip}
              className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm font-medium transition-colors"
            >
              Skip &rarr;
            </button>
          )}

          <div className="text-gray-500 text-sm">
            {totalSongs > 0
              ? `${currentIndex + 1} / ${totalSongs}`
              : "Empty queue"}
          </div>
        </div>

        <div className="flex-1 text-right min-w-0">
          {nextSong && (
            <div>
              <p className="text-gray-500 text-xs">UP NEXT</p>
              <p className="text-gray-300 text-sm truncate">{nextSong.title}</p>
              <p className="text-gray-500 text-xs truncate">{nextSong.singer}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
