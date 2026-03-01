"use client";

import { useState, useEffect, useCallback } from "react";
import AddSong from "@/components/AddSong";
import QueueList from "@/components/QueueList";
import type { QueueItem } from "@/lib/queue";

export default function Home() {
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

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

  useEffect(() => {
    fetchQueue();
    const interval = setInterval(fetchQueue, 3000);
    return () => clearInterval(interval);
  }, [fetchQueue]);

  const handleRemove = async (id: string) => {
    await fetch(`/api/queue?id=${id}`, { method: "DELETE" });
    fetchQueue();
  };

  const handleMove = async (id: string, newIndex: number) => {
    await fetch("/api/queue", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, newIndex }),
    });
    fetchQueue();
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <header className="border-b border-gray-800 bg-gray-900/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">
            Karaoke Party
          </h1>
          <a
            href="/player"
            target="_blank"
            className="px-4 py-2 bg-pink-600 hover:bg-pink-700 rounded-lg text-sm font-semibold transition-colors"
          >
            Open Player
          </a>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-8">
        {/* Add Song Section */}
        <section>
          <h2 className="text-lg font-semibold text-gray-200 mb-3">Add a Song</h2>
          <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
            <AddSong onSongAdded={fetchQueue} />
          </div>
        </section>

        {/* Queue Section */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-gray-200">
              Queue ({queue.length} {queue.length === 1 ? "song" : "songs"})
            </h2>
            {queue.length > 0 && (
              <span className="text-sm text-gray-500">
                Now: {currentIndex + 1} of {queue.length}
              </span>
            )}
          </div>
          <QueueList
            queue={queue}
            currentIndex={currentIndex}
            onRemove={handleRemove}
            onMove={handleMove}
          />
        </section>

        {/* Cast Instructions */}
        <section className="bg-gray-900 rounded-xl p-4 border border-gray-800">
          <h2 className="text-lg font-semibold text-gray-200 mb-2">
            Cast to your TV
          </h2>
          <ol className="text-gray-400 text-sm space-y-1 list-decimal list-inside">
            <li>Click &quot;Open Player&quot; above to open the full-screen player</li>
            <li>In Chrome, click the three-dot menu &rarr; &quot;Cast...&quot;</li>
            <li>Select your Chromecast device</li>
            <li>Choose &quot;Cast tab&quot; to send the player to your TV</li>
            <li>Come back here on your phone to manage the queue!</li>
          </ol>
        </section>
      </main>
    </div>
  );
}
