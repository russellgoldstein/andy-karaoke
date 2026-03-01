import { v4 as uuidv4 } from "uuid";

export interface QueueItem {
  id: string;
  videoId: string;
  title: string;
  singer: string;
  addedAt: number;
}

// In-memory queue store (persists as long as the server process runs)
const queue: QueueItem[] = [];
let currentIndex = 0;

export function getQueue(): QueueItem[] {
  return [...queue];
}

export function addToQueue(videoId: string, title: string, singer: string): QueueItem {
  const item: QueueItem = {
    id: uuidv4(),
    videoId,
    title,
    singer,
    addedAt: Date.now(),
  };
  queue.push(item);
  return item;
}

export function removeFromQueue(id: string): boolean {
  const index = queue.findIndex((item) => item.id === id);
  if (index === -1) return false;
  queue.splice(index, 1);
  // Adjust currentIndex if needed
  if (index < currentIndex) {
    currentIndex = Math.max(0, currentIndex - 1);
  } else if (currentIndex >= queue.length) {
    currentIndex = Math.max(0, queue.length - 1);
  }
  return true;
}

export function moveInQueue(id: string, newIndex: number): boolean {
  const oldIndex = queue.findIndex((item) => item.id === id);
  if (oldIndex === -1) return false;
  const clamped = Math.max(0, Math.min(newIndex, queue.length - 1));
  const [item] = queue.splice(oldIndex, 1);
  queue.splice(clamped, 0, item);
  return true;
}

export function getCurrentSong(): QueueItem | null {
  if (queue.length === 0 || currentIndex >= queue.length) return null;
  return queue[currentIndex];
}

export function getCurrentIndex(): number {
  return currentIndex;
}

export function advanceToNext(): QueueItem | null {
  if (currentIndex < queue.length - 1) {
    currentIndex++;
    return queue[currentIndex];
  }
  return null;
}

export function jumpTo(index: number): QueueItem | null {
  if (index >= 0 && index < queue.length) {
    currentIndex = index;
    return queue[currentIndex];
  }
  return null;
}
