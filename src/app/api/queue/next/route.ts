import { NextRequest, NextResponse } from "next/server";
import { advanceToNext, jumpTo, getCurrentSong, getCurrentIndex, getQueue } from "@/lib/queue";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const { jumpToIndex } = body;

  let song;
  if (jumpToIndex !== undefined) {
    song = jumpTo(jumpToIndex);
  } else {
    song = advanceToNext();
  }

  return NextResponse.json({
    current: song ?? getCurrentSong(),
    currentIndex: getCurrentIndex(),
    totalSongs: getQueue().length,
  });
}
