import React from 'react';
import { MeetingAnalytics } from '@/app/components/dashboard/MeetingAnalytics';
import { MeetingSummary } from '@/app/lib/zoom/types';

async function getRecentMeetings(): Promise<MeetingSummary[]> {
  const response = await fetch('/api/teacher/meetings', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch meetings');
  }

  return response.json();
}

export default async function TeacherDashboard() {
  const recentMeetings = await getRecentMeetings();

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Teacher Dashboard</h1>
        <button 
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          onClick={() => {/* Implement Zoom meeting connection */}}
        >
          Connect Zoom Meeting
        </button>
      </div>

      {/* Analytics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-2">Total Classes</h3>
          <p className="text-3xl font-bold">{recentMeetings.length}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-2">Total Students</h3>
          <p className="text-3xl font-bold">
            {new Set(recentMeetings.flatMap(m => 
              m.participationMetrics.map(p => p.participantId)
            )).size}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-2">Avg. Engagement</h3>
          <p className="text-3xl font-bold">
            {Math.round(
              recentMeetings.reduce((acc, meeting) => {
                const meetingAvg = meeting.participationMetrics.reduce(
                  (sum, metric) => sum + metric.engagementScore, 
                  0
                ) / meeting.participationMetrics.length;
                return acc + meetingAvg;
              }, 0) / (recentMeetings.length || 1) * 100
            )}%
          </p>
        </div>
      </div>

      {/* Recent Meetings */}
      <div>
        <h2 className="text-2xl font-bold mb-6">Recent Meetings</h2>
        {recentMeetings.length > 0 ? (
          recentMeetings.map((meeting) => (
            <MeetingAnalytics 
              key={meeting.meetingId} 
              meetingSummary={meeting} 
            />
          ))
        ) : (
          <div className="bg-white rounded-lg shadow-lg p-6 text-center">
            <p className="text-gray-500">No recent meetings found. Connect your Zoom account to start tracking meetings.</p>
          </div>
        )}
      </div>
    </div>
  );
}
