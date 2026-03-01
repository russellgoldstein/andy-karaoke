"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { getYouTubeThumbnail } from "@/lib/youtube";
import type { QueueItem } from "@/lib/queue";

export default function PlayerPage() {
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [tvWindow, setTvWindow] = useState<Window | null>(null);
  const [tvOpen, setTvOpen] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const current = queue.length > 0 && currentIndex < queue.length ? queue[currentIndex] : null;
  const nextSong = queue.length > currentIndex + 1 ? queue[currentIndex + 1] : null;

  const fetchQueue = useCallback(async () => {
    try {
      const res = await fetch("/api/queue");
      const data = await res.json();
      setQueue(data.queue);
      setCurrentIndex(data.currentIndex);
    } catch (err) {
      console.error("Failed to fetch queue:", err);
    }
  }, []);

  // Poll for queue updates
  useEffect(() => {
    fetchQueue();
    pollRef.current = setInterval(fetchQueue, 3000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [fetchQueue]);

  // Check if TV window is still open
  useEffect(() => {
    const check = setInterval(() => {
      if (tvWindow && tvWindow.closed) {
        setTvWindow(null);
        setTvOpen(false);
      }
    }, 1000);
    return () => clearInterval(check);
  }, [tvWindow]);

  const openTvWindow = () => {
    if (!current) return;
    const url = `https://www.youtube.com/watch?v=${current.videoId}`;
    const win = window.open(url, "karaoke-tv");
    if (win) {
      setTvWindow(win);
      setTvOpen(true);
    }
  };

  const playOnTv = (videoId: string) => {
    const url = `https://www.youtube.com/watch?v=${videoId}&autoplay=1`;
    if (tvWindow && !tvWindow.closed) {
      tvWindow.location.href = url;
      tvWindow.focus();
    } else {
      const win = window.open(url, "karaoke-tv");
      if (win) {
        setTvWindow(win);
        setTvOpen(true);
      }
    }
  };

  const handleNext = async () => {
    try {
      const res = await fetch("/api/queue/next", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      setCurrentIndex(data.currentIndex);
      if (data.current) {
        playOnTv(data.current.videoId);
      }
      fetchQueue();
    } catch (err) {
      console.error("Failed to advance:", err);
    }
  };

  const handleJumpTo = async (index: number) => {
    try {
      const res = await fetch("/api/queue/next", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jumpToIndex: index }),
      });
      const data = await res.json();
      setCurrentIndex(data.currentIndex);
      if (data.current) {
        playOnTv(data.current.videoId);
      }
      fetchQueue();
    } catch (err) {
      console.error("Failed to jump:", err);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <header className="border-b border-gray-800 bg-gray-900/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <h1 className="text-xl font-bold bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">
            DJ Console
          </h1>
          <div className="flex items-center gap-3">
            <span
              className={`text-xs px-2 py-1 rounded-full ${
                tvOpen
                  ? "bg-green-900 text-green-300"
                  : "bg-gray-800 text-gray-500"
              }`}
            >
              {tvOpen ? "TV Connected" : "TV Not Open"}
            </span>
            <a
              href="/"
              className="text-sm text-gray-400 hover:text-white transition-colors"
            >
              Add Songs
            </a>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Now Playing Card */}
        <section className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
          {current ? (
            <div className="flex flex-col sm:flex-row">
              <img
                src={getYouTubeThumbnail(current.videoId)}
                alt={current.title}
                className="w-full sm:w-64 h-48 sm:h-auto object-cover"
              />
              <div className="flex-1 p-5 flex flex-col justify-between">
                <div>
                  <p className="text-xs text-purple-400 font-semibold uppercase tracking-wider mb-1">
                    Now Playing
                  </p>
                  <h2 className="text-2xl font-bold text-white mb-1">
                    {current.title}
                  </h2>
                  <p className="text-gray-400">
                    Singing: <span className="text-purple-300">{current.singer}</span>
                  </p>
                </div>
                <div className="flex items-center gap-3 mt-4">
                  {!tvOpen ? (
                    <button
                      onClick={openTvWindow}
                      className="px-5 py-2.5 bg-pink-600 hover:bg-pink-700 rounded-lg font-semibold transition-colors"
                    >
                      Launch TV Window
                    </button>
                  ) : (
                    <button
                      onClick={() => playOnTv(current.videoId)}
                      className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 rounded-lg font-semibold transition-colors"
                    >
                      Replay on TV
                    </button>
                  )}
                  <button
                    onClick={handleNext}
                    disabled={!nextSong}
                    className="px-5 py-2.5 bg-gray-800 hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg font-semibold transition-colors"
                  >
                    Next Song &rarr;
                  </button>
                  <span className="text-gray-500 text-sm ml-auto">
                    {currentIndex + 1} / {queue.length}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center">
              <h2 className="text-2xl font-bold text-gray-500 mb-2">
                No songs in the queue
              </h2>
              <p className="text-gray-600">
                <a href="/" className="text-purple-400 hover:text-purple-300 underline">
                  Add songs
                </a>{" "}
                to get the party started!
              </p>
            </div>
          )}
        </section>

        {/* Up Next */}
        {nextSong && (
          <section className="bg-gray-900/50 rounded-xl border border-gray-800 p-4 flex items-center gap-4">
            <img
              src={getYouTubeThumbnail(nextSong.videoId)}
              alt={nextSong.title}
              className="w-16 h-12 object-cover rounded"
            />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-500 uppercase tracking-wider">Up Next</p>
              <p className="text-white font-medium truncate">{nextSong.title}</p>
              <p className="text-gray-500 text-sm">{nextSong.singer}</p>
            </div>
          </section>
        )}

        {/* How to Cast */}
        {!tvOpen && current && (
          <section className="bg-blue-950/30 border border-blue-900/50 rounded-xl p-4">
            <h3 className="text-sm font-semibold text-blue-300 mb-2">
              How to Cast to your TV
            </h3>
            <ol className="text-blue-200/70 text-sm space-y-1 list-decimal list-inside">
              <li>Click &quot;Launch TV Window&quot; above &mdash; YouTube opens in a new window</li>
              <li>On that YouTube window, click the <strong>Cast</strong> icon in Chrome&apos;s toolbar</li>
              <li>Select your Chromecast &mdash; the video plays on your TV</li>
              <li>Come back here to control the queue and advance songs</li>
            </ol>
          </section>
        )}

        {/* Full Queue */}
        <section>
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
            Playlist ({queue.length} songs)
          </h3>
          <div className="space-y-1">
            {queue.map((item, index) => (
              <button
                key={item.id}
                onClick={() => handleJumpTo(index)}
                className={`w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors ${
                  index === currentIndex
                    ? "bg-purple-900/40 border border-purple-700"
                    : index < currentIndex
                    ? "bg-gray-900/30 opacity-50 hover:opacity-75"
                    : "bg-gray-900/50 hover:bg-gray-800/80"
                }`}
              >
                <span className="text-gray-600 font-mono text-sm w-6 text-center flex-shrink-0">
                  {index === currentIndex ? (
                    <span className="text-purple-400">&#9654;</span>
                  ) : (
                    index + 1
                  )}
                </span>
                <img
                  src={getYouTubeThumbnail(item.videoId)}
                  alt={item.title}
                  className="w-12 h-9 object-cover rounded flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium truncate">{item.title}</p>
                  <p className="text-gray-500 text-xs">{item.singer}</p>
                </div>
              </button>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
