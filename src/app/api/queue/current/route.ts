import { NextResponse } from "next/server";
import { getCurrentSong, getCurrentIndex, getQueue } from "@/lib/queue";

export async function GET() {
  return NextResponse.json({
    current: getCurrentSong(),
    currentIndex: getCurrentIndex(),
    totalSongs: getQueue().length,
  });
}
