import { NextResponse } from 'next/server';
import { ZoomService } from '@/app/lib/zoom/zoomService';
import { OpenAIService } from '@/app/lib/openai/openaiService';

const zoomService = new ZoomService();
const openaiService = new OpenAIService();

export async function POST(request: Request) {
  try {
    const { meetingId } = await request.json();

    // Get meeting details and recording
    const [meetingDetails, recordingInfo] = await Promise.all([
      zoomService.getMeetingDetails(meetingId),
      zoomService.getMeetingRecording(meetingId).catch(error => {
        console.error('Error getting recording:', error);
        return 'No recording available';
      })
    ]);

    // Generate a basic summary using OpenAI
    const summary = await openaiService.generateMeetingSummary(
      `Meeting Topic: ${meetingDetails.topic}\n` +
      `Start Time: ${meetingDetails.start_time}\n` +
      `Duration: ${meetingDetails.duration} minutes\n` +
      `Recording Status: ${recordingInfo === 'No recording available' ? 'Not available' : 'Available'}`,
      [{
        participantId: 'host',
        name: 'Host',
        totalTimeInMeeting: meetingDetails.duration * 60,
        engagementScore: 100,
        speakingTime: 0,
        chatMessages: 0,
        attentiveness: 100
      }]
    );

    return NextResponse.json({
      meetingId,
      topic: meetingDetails.topic,
      date: meetingDetails.start_time,
      duration: meetingDetails.duration,
      participantCount: meetingDetails.participants_count || 1,
      summary: summary.summary,
      keyPoints: summary.keyPoints,
      recordingInfo,
      participationMetrics: [{
        participantId: 'host',
        name: 'Host',
        totalTimeInMeeting: meetingDetails.duration * 60,
        engagementScore: 100,
        speakingTime: 0,
        chatMessages: 0,
        attentiveness: 100
      }]
    });
  } catch (error) {
    console.error('Error analyzing meeting:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to analyze meeting' },
      { status: 500 }
    );
  }
}
