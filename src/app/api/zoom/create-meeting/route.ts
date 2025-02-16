import { NextResponse } from 'next/server';
import { ZoomService } from '@/app/lib/zoom/zoomService';

const zoomService = new ZoomService();

export async function POST(request: Request) {
  try {
    const { topic, duration = 30, start_time } = await request.json();
    const meeting = await zoomService.createMeeting({
      topic,
      duration,
      start_time,
      type: 2, // Scheduled meeting
      settings: {
        host_video: true,
        participant_video: true,
        join_before_host: true,
        mute_upon_entry: false,
        auto_recording: "cloud"
      }
    });

    return NextResponse.json(meeting);
  } catch (error) {
    console.error('Error creating meeting:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create meeting' },
      { status: 500 }
    );
  }
}
