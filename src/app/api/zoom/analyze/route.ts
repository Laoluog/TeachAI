import { NextResponse } from 'next/server';
import { ZoomService } from '@/app/lib/zoom/zoomService';
import { OpenAIService } from '@/app/lib/openai/openaiService';
import { MeetingSummary } from '@/app/lib/zoom/types';

const zoomService = new ZoomService();
const openaiService = new OpenAIService();

export async function POST(request: Request) {
  try {
    const { meetingId } = await request.json();

    // Get meeting details and participants
    const [meetingDetails, participants] = await Promise.all([
      zoomService.getMeetingDetails(meetingId),
      zoomService.getMeetingParticipants(meetingId),
    ]);

    // Get meeting recording and transcript
    const recording = await zoomService.getMeetingRecording(meetingId);

    // Analyze participation
    const participationMetrics = await zoomService.analyzeMeetingParticipation(meetingId);

    // Generate meeting summary using Gemini
    const summary = await geminiService.generateMeetingSummary(
      recording, // You'll need to implement transcript extraction from recording
      participationMetrics
    );

    const meetingSummary: MeetingSummary = {
      meetingId,
      topic: meetingDetails.topic,
      date: meetingDetails.start_time,
      duration: meetingDetails.duration,
      participantCount: meetingDetails.participants_count,
      summary: summary.summary || '',
      keyPoints: summary.keyPoints || [],
      participationMetrics,
    };

    return NextResponse.json(meetingSummary);
  } catch (error) {
    console.error('Error analyzing meeting:', error);
    return NextResponse.json(
      { error: 'Failed to analyze meeting' },
      { status: 500 }
    );
  }
}
