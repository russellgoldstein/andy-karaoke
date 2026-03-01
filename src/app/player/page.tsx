"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import YouTube, { YouTubeEvent } from "react-youtube";
import type { QueueItem } from "@/lib/queue";

export default function PlayerPage() {
  const [current, setCurrent] = useState<QueueItem | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [totalSongs, setTotalSongs] = useState(0);
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const playerRef = useRef<YouTube>(null);

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

  useEffect(() => {
    fetchCurrent();
    fetchQueue();
    const interval = setInterval(() => {
      fetchCurrent();
      fetchQueue();
    }, 3000);
    return () => clearInterval(interval);
  }, [fetchCurrent, fetchQueue]);

  const handleVideoEnd = async () => {
    setIsPlaying(false);
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
  };

  const handleSkip = async () => {
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
      console.error("Failed to skip:", err);
    }
  };

  const handlePlay = () => setIsPlaying(true);
  const handlePause = () => setIsPlaying(false);

  const handleReady = (event: YouTubeEvent) => {
    event.target.playVideo();
  };

  // Next song in queue (for "up next" display)
  const nextSong = queue.length > currentIndex + 1 ? queue[currentIndex + 1] : null;

  return (
    <div className="h-screen w-screen bg-black text-white flex flex-col overflow-hidden">
      {/* Video area */}
      <div className="flex-1 relative flex items-center justify-center">
        {current ? (
          <YouTube
            ref={playerRef}
            videoId={current.videoId}
            opts={{
              width: "100%",
              height: "100%",
              playerVars: {
                autoplay: 1,
                controls: 1,
                modestbranding: 1,
                rel: 0,
                fs: 1,
              },
            }}
            onEnd={handleVideoEnd}
            onPlay={handlePlay}
            onPause={handlePause}
            onReady={handleReady}
            className="absolute inset-0"
            iframeClassName="w-full h-full"
          />
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
