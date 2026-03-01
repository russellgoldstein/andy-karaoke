import { NextRequest, NextResponse } from "next/server";
import {
  getQueue,
  addToQueue,
  removeFromQueue,
  moveInQueue,
  getCurrentIndex,
} from "@/lib/queue";

export async function GET() {
  return NextResponse.json({
    queue: getQueue(),
    currentIndex: getCurrentIndex(),
  });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { videoId, title, singer } = body;

  if (!videoId || !title) {
    return NextResponse.json(
      { error: "videoId and title are required" },
      { status: 400 }
    );
  }

  try {
    const item = addToQueue(videoId, title, singer || "Anonymous");
    return NextResponse.json(item, { status: 201 });
  } catch (err) {
    console.error("Failed to add song:", err);
    return NextResponse.json(
      { error: String(err) },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  const removed = removeFromQueue(id);
  if (!removed) {
    return NextResponse.json({ error: "Item not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}

export async function PATCH(request: NextRequest) {
  const body = await request.json();
  const { id, newIndex } = body;

  if (!id || newIndex === undefined) {
    return NextResponse.json(
      { error: "id and newIndex are required" },
      { status: 400 }
    );
  }

  const moved = moveInQueue(id, newIndex);
  if (!moved) {
    return NextResponse.json({ error: "Item not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
