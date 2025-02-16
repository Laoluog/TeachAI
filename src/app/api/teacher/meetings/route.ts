import { NextResponse } from 'next/server';
import { ZoomService } from '@/app/lib/zoom/zoomService';
import { GeminiService } from '@/app/lib/zoom/geminiService';
import { MeetingSummary } from '@/app/lib/zoom/types';

const zoomService = new ZoomService(
  process.env.ZOOM_API_KEY || '',
  process.env.ZOOM_API_SECRET || ''
);

const geminiService = new GeminiService(
  process.env.GEMINI_API_KEY || ''
);

export async function GET(request: Request) {
  try {
    // Get the teacher's ID from the session/token
    // This is a placeholder - implement your auth logic
    const teacherId = 'placeholder';

    // Get list of recent meetings for this teacher
    const meetings = await zoomService.getTeacherMeetings(teacherId);

    // Process each meeting to get full analytics
    const meetingSummaries = await Promise.all(
      meetings.map(async (meeting) => {
        const [meetingDetails, participants] = await Promise.all([
          zoomService.getMeetingDetails(meeting.id),
          zoomService.getMeetingParticipants(meeting.id),
        ]);

        // Get meeting recording and transcript
        const recording = await zoomService.getMeetingRecording(meeting.id);

        // Analyze participation
        const participationMetrics = await zoomService.analyzeMeetingParticipation(meeting.id);

        // Generate meeting summary using Gemini
        const summary = await geminiService.generateMeetingSummary(
          recording,
          participationMetrics
        );

        return {
          meetingId: meeting.id,
          topic: meetingDetails.topic,
          date: meetingDetails.start_time,
          duration: meetingDetails.duration,
          participantCount: meetingDetails.participants_count,
          summary: summary.summary || '',
          keyPoints: summary.keyPoints || [],
          participationMetrics,
        };
      })
    );

    return NextResponse.json(meetingSummaries);
  } catch (error) {
    console.error('Error fetching teacher meetings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch meetings' },
      { status: 500 }
    );
  }
}
