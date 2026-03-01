import { randomUUID } from "crypto";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { tmpdir } from "os";

export interface QueueItem {
  id: string;
  videoId: string;
  title: string;
  singer: string;
  addedAt: number;
}

interface QueueData {
  queue: QueueItem[];
  currentIndex: number;
}

function getDataPath(): string {
  // Try project root first, fall back to OS temp dir
  const projectPath = join(process.cwd(), "queue-data.json");
  try {
    // Test if we can write to the project directory
    const dir = dirname(projectPath);
    if (existsSync(dir)) {
      return projectPath;
    }
  } catch { /* fall through */ }
  // Fallback: use temp directory
  const fallback = join(tmpdir(), "karaoke-queue-data.json");
  mkdirSync(dirname(fallback), { recursive: true });
  return fallback;
}

const DATA_PATH = getDataPath();

function load(): QueueData {
  if (!existsSync(DATA_PATH)) {
    return { queue: [], currentIndex: 0 };
  }
  try {
    const raw = readFileSync(DATA_PATH, "utf-8");
    return JSON.parse(raw) as QueueData;
  } catch {
    return { queue: [], currentIndex: 0 };
  }
}

function save(data: QueueData): void {
  writeFileSync(DATA_PATH, JSON.stringify(data, null, 2));
}

export function getQueue(): QueueItem[] {
  return [...load().queue];
}

export function addToQueue(videoId: string, title: string, singer: string): QueueItem {
  const data = load();
  const item: QueueItem = {
    id: randomUUID(),
    videoId,
    title,
    singer,
    addedAt: Date.now(),
  };
  data.queue.push(item);
  save(data);
  return item;
}

export function removeFromQueue(id: string): boolean {
  const data = load();
  const index = data.queue.findIndex((item) => item.id === id);
  if (index === -1) return false;
  data.queue.splice(index, 1);
  // Adjust currentIndex if needed
  if (index < data.currentIndex) {
    data.currentIndex = Math.max(0, data.currentIndex - 1);
  } else if (data.currentIndex >= data.queue.length) {
    data.currentIndex = Math.max(0, data.queue.length - 1);
  }
  save(data);
  return true;
}

export function moveInQueue(id: string, newIndex: number): boolean {
  const data = load();
  const oldIndex = data.queue.findIndex((item) => item.id === id);
  if (oldIndex === -1) return false;
  const clamped = Math.max(0, Math.min(newIndex, data.queue.length - 1));
  const [item] = data.queue.splice(oldIndex, 1);
  data.queue.splice(clamped, 0, item);
  save(data);
  return true;
}

export function getCurrentSong(): QueueItem | null {
  const data = load();
  if (data.queue.length === 0 || data.currentIndex >= data.queue.length) return null;
  return data.queue[data.currentIndex];
}

export function getCurrentIndex(): number {
  return load().currentIndex;
}

export function advanceToNext(): QueueItem | null {
  const data = load();
  if (data.currentIndex < data.queue.length - 1) {
    data.currentIndex++;
    save(data);
    return data.queue[data.currentIndex];
  }
  return null;
}

export function jumpTo(index: number): QueueItem | null {
  const data = load();
  if (index >= 0 && index < data.queue.length) {
    data.currentIndex = index;
    save(data);
    return data.queue[data.currentIndex];
  }
  return null;
}
