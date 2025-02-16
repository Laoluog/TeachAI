import React from 'react';
import { MeetingSummary, ParticipationMetrics } from '@/app/lib/zoom/types';

interface MeetingAnalyticsProps {
  meetingSummary: MeetingSummary;
}

export const MeetingAnalytics: React.FC<MeetingAnalyticsProps> = ({ meetingSummary }) => {
  return (
    <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
      <h2 className="text-2xl font-bold mb-4">{meetingSummary.topic}</h2>
      
      {/* Meeting Overview */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-gray-50 p-4 rounded">
          <h3 className="text-sm font-semibold text-gray-500">Date</h3>
          <p className="text-lg">{new Date(meetingSummary.date).toLocaleDateString()}</p>
        </div>
        <div className="bg-gray-50 p-4 rounded">
          <h3 className="text-sm font-semibold text-gray-500">Duration</h3>
          <p className="text-lg">{meetingSummary.duration} minutes</p>
        </div>
        <div className="bg-gray-50 p-4 rounded">
          <h3 className="text-sm font-semibold text-gray-500">Participants</h3>
          <p className="text-lg">{meetingSummary.participantCount}</p>
        </div>
      </div>

      {/* Meeting Summary */}
      <div className="mb-6">
        <h3 className="text-xl font-semibold mb-3">Summary</h3>
        <p className="text-gray-700">{meetingSummary.summary}</p>
      </div>

      {/* Key Points */}
      <div className="mb-6">
        <h3 className="text-xl font-semibold mb-3">Key Points</h3>
        <ul className="list-disc pl-5">
          {meetingSummary.keyPoints.map((point, index) => (
            <li key={index} className="text-gray-700 mb-2">{point}</li>
          ))}
        </ul>
      </div>

      {/* Participation Metrics */}
      <div>
        <h3 className="text-xl font-semibold mb-3">Student Participation</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-4 py-2 text-left">Student</th>
                <th className="px-4 py-2 text-left">Time in Meeting</th>
                <th className="px-4 py-2 text-left">Engagement Score</th>
                <th className="px-4 py-2 text-left">Speaking Time</th>
                <th className="px-4 py-2 text-left">Chat Messages</th>
              </tr>
            </thead>
            <tbody>
              {meetingSummary.participationMetrics.map((metric) => (
                <tr key={metric.participantId} className="border-t">
                  <td className="px-4 py-2">{metric.name}</td>
                  <td className="px-4 py-2">{Math.round(metric.totalTimeInMeeting / 60)} mins</td>
                  <td className="px-4 py-2">
                    <div className="flex items-center">
                      <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                        <div
                          className="bg-blue-600 rounded-full h-2"
                          style={{ width: `${metric.engagementScore * 100}%` }}
                        />
                      </div>
                      {Math.round(metric.engagementScore * 100)}%
                    </div>
                  </td>
                  <td className="px-4 py-2">{Math.round(metric.speakingTime / 60)} mins</td>
                  <td className="px-4 py-2">{metric.chatMessages}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
