"use client";

import { getYouTubeThumbnail } from "@/lib/youtube";
import type { QueueItem } from "@/lib/queue";

interface QueueListProps {
  queue: QueueItem[];
  currentIndex: number;
  onRemove: (id: string) => void;
  onMove: (id: string, newIndex: number) => void;
}

export default function QueueList({ queue, currentIndex, onRemove, onMove }: QueueListProps) {
  if (queue.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p className="text-lg">No songs in the queue yet</p>
        <p className="text-sm mt-1">Add a song to get the party started!</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {queue.map((item, index) => (
        <div
          key={item.id}
          className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
            index === currentIndex
              ? "bg-purple-900/50 border border-purple-500"
              : index < currentIndex
              ? "bg-gray-800/50 opacity-60"
              : "bg-gray-800/80"
          }`}
        >
          <div className="flex-shrink-0 text-gray-500 font-mono text-sm w-6 text-center">
            {index === currentIndex ? (
              <span className="text-purple-400 text-lg">&#9654;</span>
            ) : (
              index + 1
            )}
          </div>

          <img
            src={getYouTubeThumbnail(item.videoId)}
            alt={item.title}
            className="w-16 h-12 object-cover rounded flex-shrink-0"
          />

          <div className="flex-1 min-w-0">
            <p className="text-white font-medium truncate">{item.title}</p>
            <p className="text-gray-400 text-sm truncate">{item.singer}</p>
          </div>

          <div className="flex items-center gap-1 flex-shrink-0">
            {index > 0 && (
              <button
                onClick={() => onMove(item.id, index - 1)}
                className="p-1 text-gray-500 hover:text-white transition-colors"
                title="Move up"
              >
                &#9650;
              </button>
            )}
            {index < queue.length - 1 && (
              <button
                onClick={() => onMove(item.id, index + 1)}
                className="p-1 text-gray-500 hover:text-white transition-colors"
                title="Move down"
              >
                &#9660;
              </button>
            )}
            <button
              onClick={() => onRemove(item.id)}
              className="p-1 text-gray-500 hover:text-red-400 transition-colors ml-1"
              title="Remove"
            >
              &#10005;
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
