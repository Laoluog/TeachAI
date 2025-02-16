import { NextResponse } from 'next/server';
import { ZoomService } from '@/app/lib/zoom/zoomService';
import { OpenAIService } from '@/app/lib/openai/openaiService';

const zoomService = new ZoomService();
const openaiService = new OpenAIService();

export async function GET() {
  try {
    // Test Zoom connection
    const userInfo = await zoomService.getUserInfo();
    const meetings = await zoomService.listMeetings();

    // Test OpenAI connection with a simple prompt
    const testMetrics = [{
      participantId: "test123",
      name: "Test Student",
      totalTimeInMeeting: 3600,
      engagementScore: 0.8,
      speakingTime: 600,
      chatMessages: 5,
      attentiveness: 0.9
    }];

    const summary = await openaiService.generateMeetingSummary(
      "This is a test transcript for a mock class discussion about AI in education.",
      testMetrics
    );

    return NextResponse.json({
      status: 'success',
      zoom: {
        userInfo,
        meetings
      },
      openai: summary
    });
  } catch (error) {
    console.error('Test failed:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error occurred' },
      { status: 500 }
    );
  }
}
