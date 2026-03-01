"use client";

import { useState } from "react";
import { extractVideoId } from "@/lib/youtube";

interface AddSongProps {
  onSongAdded: () => void;
}

export default function AddSong({ onSongAdded }: AddSongProps) {
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [singer, setSinger] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const videoId = extractVideoId(url);
    if (!videoId) {
      setError("Please enter a valid YouTube URL or video ID");
      return;
    }

    if (!title.trim()) {
      setError("Please enter a song title");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/queue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          videoId,
          title: title.trim(),
          singer: singer.trim() || "Anonymous",
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Server error (${res.status})`);
      }

      setUrl("");
      setTitle("");
      setSinger("");
      onSongAdded();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add song. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label htmlFor="url" className="block text-sm font-medium text-gray-300 mb-1">
          YouTube URL or Video ID
        </label>
        <input
          id="url"
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://youtube.com/watch?v=... or paste video ID"
          className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
        />
      </div>

      <div>
        <label htmlFor="title" className="block text-sm font-medium text-gray-300 mb-1">
          Song Title
        </label>
        <input
          id="title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Don't Stop Believin'"
          className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
        />
      </div>

      <div>
        <label htmlFor="singer" className="block text-sm font-medium text-gray-300 mb-1">
          Your Name
        </label>
        <input
          id="singer"
          type="text"
          value={singer}
          onChange={(e) => setSinger(e.target.value)}
          placeholder="Who's singing?"
          className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
        />
      </div>

      {error && <p className="text-red-400 text-sm">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="w-full py-2 px-4 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors"
      >
        {loading ? "Adding..." : "Add to Queue"}
      </button>
    </form>
  );
}
