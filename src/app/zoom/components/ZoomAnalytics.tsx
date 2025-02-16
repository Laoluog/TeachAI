'use client';

import { useState, useEffect } from 'react';
import styles from '../styles/Teacher.module.css';
import ZoomMeetingUploader from './ZoomMeetingUploader';
import { MeetingAnalytics } from './dashboard/MeetingAnalytics';
import { MeetingSummary } from '../lib/zoom/types';
import { OpenAIService } from '../lib/openai/openaiService';

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
  const [transcriptAnalysis, setTranscriptAnalysis] = useState<{
    studentObjectives: string[];
    teacherObjectives: string[];
    meetingEffectiveness: number;
    overallFeedback: string;
  } | null>(null);
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

      // Analyze transcript
      if (data.transcript) {
        const openaiService = new OpenAIService();
        const analysis = await openaiService.analyzeMeetingTranscript(data.transcript);
        setTranscriptAnalysis(analysis);
      }
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
          <MeetingAnalytics meetingSummary={meetingData} />
          
          <h4>Detailed Participant Metrics</h4>
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
        </div>
      )}

      {/* Transcript Analysis */}
      {transcriptAnalysis && (
        <div className={styles.transcriptAnalysisContainer}>
          <h3>Meeting Transcript Analysis</h3>
          
          <div className={styles.objectivesSection}>
            <h4>Teacher Objectives</h4>
            <ul>
              {transcriptAnalysis.teacherObjectives.map((obj, index) => (
                <li key={index}>{obj}</li>
              ))}
            </ul>

            <h4>Student Objectives</h4>
            <ul>
              {transcriptAnalysis.studentObjectives.map((obj, index) => (
                <li key={index}>{obj}</li>
              ))}
            </ul>
          </div>

          <div className={styles.effectivenessSection}>
            <h4>Meeting Effectiveness</h4>
            <div className={styles.progressBar}>
              <div 
                className={styles.progressFill}
                style={{ 
                  width: `${transcriptAnalysis.meetingEffectiveness}%`,
                  backgroundColor: transcriptAnalysis.meetingEffectiveness > 70 
                    ? 'green' 
                    : transcriptAnalysis.meetingEffectiveness > 40 
                      ? 'orange' 
                      : 'red'
                }}
              />
              <span>{transcriptAnalysis.meetingEffectiveness}%</span>
            </div>
          </div>

          <div className={styles.feedbackSection}>
            <h4>Overall Feedback</h4>
            <p>{transcriptAnalysis.overallFeedback}</p>
          </div>
        </div>
      )}
    </div>
  );
}
