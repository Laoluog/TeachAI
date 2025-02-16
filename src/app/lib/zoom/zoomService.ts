import { ZoomMeetingParticipant, ZoomMeetingDetails, ParticipationMetrics } from './types';

export class ZoomService {
  private accountId: string;
  private clientId: string;
  private clientSecret: string;
  private accessToken: string | null = null;
  private tokenExpiry: number = 0;

  constructor() {
    const accountId = process.env.ZOOM_ACCOUNT_ID;
    const clientId = process.env.ZOOM_CLIENT_ID;
    const clientSecret = process.env.ZOOM_CLIENT_SECRET;

    if (!accountId || !clientId || !clientSecret) {
      throw new Error('Missing required Zoom credentials in environment variables');
    }

    this.accountId = accountId;
    this.clientId = clientId;
    this.clientSecret = clientSecret;
  }

  private async getAccessToken(): Promise<string> {
    try {
      // Check if we have a valid token
      if (this.accessToken && Date.now() < this.tokenExpiry) {
        return this.accessToken;
      }

      console.log('Getting new Zoom access token...');
      console.log('Account ID:', this.accountId);
      console.log('Client ID:', this.clientId);
      console.log('Client Secret length:', this.clientSecret.length);

      const credentials = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64');
      console.log('Base64 credentials length:', credentials.length);

      const params = new URLSearchParams({
        'grant_type': 'account_credentials',
        'account_id': this.accountId,
      });

      console.log('Request params:', params.toString());

      // Get new token
      const response = await fetch('https://zoom.us/oauth/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${credentials}`,
          'Accept': 'application/json',
        },
        body: params.toString(),
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));

      const responseText = await response.text();
      console.log('Raw response:', responseText);

      if (!response.ok) {
        let errorMessage = 'Unknown error';
        try {
          const errorData = JSON.parse(responseText);
          errorMessage = errorData.message || errorData.error || response.statusText;
          console.error('Zoom token error:', errorData);
        } catch (e) {
          console.error('Failed to parse error response:', responseText);
        }
        throw new Error(`Failed to get Zoom access token: ${errorMessage}`);
      }

      const data = JSON.parse(responseText);
      this.accessToken = data.access_token;
      this.tokenExpiry = Date.now() + (data.expires_in * 1000);
      console.log('Successfully obtained new access token');
      return this.accessToken;
    } catch (error) {
      console.error('Error getting access token:', error);
      throw error;
    }
  }

  async getUserInfo() {
    const token = await this.getAccessToken();
    const response = await fetch('https://api.zoom.us/v2/users/me', {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to get user info');
    }

    return response.json();
  }

  async listMeetings() {
    const token = await this.getAccessToken();
    const response = await fetch('https://api.zoom.us/v2/users/me/meetings?type=scheduled', {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to list meetings');
    }

    return response.json();
  }

  async createMeeting(meetingConfig: {
    topic: string;
    duration: number;
    start_time?: string;
    type: number;
    settings: {
      host_video: boolean;
      participant_video: boolean;
      join_before_host: boolean;
      mute_upon_entry: boolean;
      auto_recording: string;
    };
  }) {
    const token = await this.getAccessToken();
    const userInfo = await this.getUserInfo();

    const response = await fetch(`https://api.zoom.us/v2/users/${userInfo.id}/meetings`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...meetingConfig,
        start_time: meetingConfig.start_time || new Date().toISOString(),
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Failed to create meeting: ${error.message}`);
    }

    return response.json();
  }

  async getMeetingDetails(meetingId: string): Promise<ZoomMeetingDetails> {
    const token = await this.getAccessToken();
    const response = await fetch(`https://api.zoom.us/v2/meetings/${meetingId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to get meeting details');
    }

    return response.json();
  }

  async getMeetingParticipants(meetingId: string): Promise<ZoomMeetingParticipant[]> {
    const token = await this.getAccessToken();
    const response = await fetch(`https://api.zoom.us/v2/past_meetings/${meetingId}/participants`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Failed to get meeting participants: ${error.message || response.statusText}`);
    }

    const data = await response.json();
    return data.participants || [];
  }

  async getMeetingRecording(meetingId: string): Promise<string> {
    try {
      console.log('Getting recording for meeting:', meetingId);
      const token = await this.getAccessToken();
      
      // Try cloud recordings endpoint
      const cloudResponse = await fetch(`https://api.zoom.us/v2/meetings/${meetingId}/recordings`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      console.log('Cloud recording response status:', cloudResponse.status);
      const cloudText = await cloudResponse.text();
      console.log('Cloud recording response:', cloudText);

      if (cloudResponse.ok) {
        const data = JSON.parse(cloudText);
        console.log('Recording data:', data);

        if (data.recording_files && data.recording_files.length > 0) {
          // Get the audio transcript if available
          const transcript = data.recording_files.find((file: any) => 
            file.recording_type === 'audio_transcript' || 
            file.file_type === 'TRANSCRIPT'
          );

          // Get the recording URL
          const recording = data.recording_files.find((file: any) => 
            file.recording_type === 'shared_screen_with_speaker_view' || 
            file.file_type === 'MP4'
          );

          if (transcript) {
            console.log('Found transcript URL:', transcript.download_url);
            return transcript.download_url;
          } else if (recording) {
            console.log('Found recording URL:', recording.download_url);
            return recording.download_url;
          }
        }
      }

      // If no recording found, check if the meeting has ended
      const meetingResponse = await fetch(`https://api.zoom.us/v2/meetings/${meetingId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (meetingResponse.ok) {
        const meetingData = await meetingResponse.json();
        if (meetingData.status === 'waiting' || meetingData.status === 'started') {
          return 'Meeting is still in progress. Recording will be available after the meeting ends.';
        }
      }

      // Try past meetings endpoint as a last resort
      const pastResponse = await fetch(`https://api.zoom.us/v2/past_meetings/${meetingId}/recordings`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      console.log('Past meeting recording response status:', pastResponse.status);
      const pastText = await pastResponse.text();
      console.log('Past meeting recording response:', pastText);

      if (pastResponse.ok) {
        const data = JSON.parse(pastText);
        if (data.recording_files && data.recording_files.length > 0) {
          const transcript = data.recording_files.find((file: any) => 
            file.recording_type === 'audio_transcript' || 
            file.file_type === 'TRANSCRIPT'
          );
          const recording = data.recording_files.find((file: any) => 
            file.recording_type === 'shared_screen_with_speaker_view' || 
            file.file_type === 'MP4'
          );

          if (transcript) {
            console.log('Found transcript URL from past meetings:', transcript.download_url);
            return transcript.download_url;
          } else if (recording) {
            console.log('Found recording URL from past meetings:', recording.download_url);
            return recording.download_url;
          }
        }
      }

      return 'Recording is still processing or not available. Please try again in a few minutes.';
    } catch (error) {
      console.error('Error getting recording:', error);
      return 'Error getting recording: ' + (error instanceof Error ? error.message : String(error));
    }
  }

  async analyzeMeetingParticipation(meetingId: string): Promise<ParticipationMetrics[]> {
    const participants = await this.getMeetingParticipants(meetingId);
    
    return participants.map(participant => ({
      participantId: participant.id || participant.user_id,
      name: participant.user_name,
      totalTimeInMeeting: participant.duration || 0,
      engagementScore: this.calculateEngagementScore(participant),
      speakingTime: 0, // Zoom API doesn't provide this directly
      chatMessages: 0, // Zoom API doesn't provide this directly
      attentiveness: participant.attentiveness_score ? parseInt(participant.attentiveness_score) : 0,
    }));
  }

  private calculateEngagementScore(participant: ZoomMeetingParticipant): number {
    // Calculate engagement score based on various factors
    const speakingWeight = 0.4;
    const chatWeight = 0.3;
    const attentivenessWeight = 0.3;

    const speakingScore = (participant.speakingTime || 0) / participant.timeInMeeting;
    const chatScore = (participant.chatCount || 0) / 10; // Normalize to 0-1
    const attentivenessScore = participant.attentiveness || 0;

    return (
      speakingScore * speakingWeight +
      chatScore * chatWeight +
      attentivenessScore * attentivenessWeight
    );
  }

  private calculateTotalTime(timeInMeeting: number[]): number {
    return timeInMeeting.reduce((acc, time) => acc + time, 0);
  }

  private async getZoomAccessToken(): Promise<string> {
    // Implement JWT token generation for Zoom API
    // This is a placeholder - actual implementation needed
    return '';
  }
}
