export interface ZoomMeetingParticipant {
  id?: string;
  user_id: string;
  user_name: string;
  device: string;
  ip_address: string;
  location: string;
  network_type: string;
  join_time: string;
  leave_time: string;
  share_application: boolean;
  share_desktop: boolean;
  share_whiteboard: boolean;
  recording: boolean;
  pc_name: string;
  domain: string;
  mac_addr: string;
  harddisk_id: string;
  version: string;
  duration: number;
  attentiveness_score?: string;
}

export interface ZoomMeetingDetails {
  id: string;
  topic: string;
  start_time: string;
  duration: number;
  participants_count: number;
}

export interface ParticipationMetrics {
  participantId: string;
  name: string;
  totalTimeInMeeting: number;
  engagementScore: number;
  speakingTime: number;
  chatMessages: number;
  attentiveness: number;
}

export interface MeetingSummary {
  meetingId: string;
  topic: string;
  date: string;
  duration: number;
  participantCount: number;
  summary: string;
  keyPoints: string[];
  participationMetrics: ParticipationMetrics[];
}
