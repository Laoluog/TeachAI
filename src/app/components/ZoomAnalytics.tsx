'use client';

import { useState, useEffect } from 'react';
import styles from '../styles/Teacher.module.css';
import ZoomMeetingUploader from './ZoomMeetingUploader';
import { MeetingAnalytics } from './dashboard/MeetingAnalytics';
import { MeetingSummary } from '../lib/zoom/types';

interface ZoomMeetingData extends MeetingSummary {
  meetingId: string;
  participants: Array<{
    participantId: string;
    name: string;
    totalTimeInMeeting: number;
    engagementScore: number;
    speakingTime: number;
    chatMessages: number;
  }>;
}

export default function ZoomAnalytics() {
  const [meetingData, setMeetingData] = useState<ZoomMeetingData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchZoomAnalytics = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/zoom/analyze-meeting');
      if (!response.ok) {
        throw new Error('Failed to fetch Zoom analytics');
      }
      const data = await response.json();
      setMeetingData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchZoomAnalytics();
  }, []);

  if (isLoading) return <div className={styles.loadingSpinner}>Loading...</div>;
  if (error) return <div className={styles.errorMessage}>{error}</div>;

  return (
    <div className={styles.zoomAnalyticsContainer}>
      <h2>Zoom Meeting Analytics</h2>
      
      {/* Meeting Uploader */}
      <ZoomMeetingUploader />

      {/* Analytics Display */}
      {meetingData && (
        <div className={styles.meetingDetailsCard}>
          <h3>Meeting Details</h3>
          <p>Date: {meetingData.date}</p>
          <p>Duration: {meetingData.duration} minutes</p>
          
          <h4>Participants</h4>
          <table className={styles.participantsTable}>
            <thead>
              <tr>
                <th>Name</th>
                <th>Engagement Score</th>
                <th>Speaking Time</th>
                <th>Chat Messages</th>
              </tr>
            </thead>
            <tbody>
              {meetingData.participants.map((participant, index) => (
                <tr key={index}>
                  <td>{participant.name}</td>
                  <td>{participant.engagementScore.toFixed(2)}</td>
                  <td>{participant.speakingTime} seconds</td>
                  <td>{participant.chatMessages}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <h4>Meeting Summary</h4>
          <MeetingAnalytics meetingData={meetingData} />
        </div>
      )}
    </div>
  );
}
