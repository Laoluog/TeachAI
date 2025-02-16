export interface ParticipationMetrics {
  participantId: string;
  name: string;
  totalTimeInMeeting: number; // in seconds
  engagementScore: number; // 0-1 range
  speakingTime: number; // in seconds
  chatMessages: number;
}

export interface MeetingSummary {
  topic: string;
  date: string; // ISO date string
  duration: number; // in minutes
  participantCount: number;
  summary: string;
  keyPoints: string[];
  participationMetrics: ParticipationMetrics[];
}

// Sample data generation function for testing
export function generateSampleMeetingSummary(): MeetingSummary {
  return {
    topic: "Machine Learning Introduction",
    date: new Date().toISOString(),
    duration: 90,
    participantCount: 5,
    summary: "An introductory session covering the basics of machine learning, including supervised and unsupervised learning techniques.",
    keyPoints: [
      "Defined machine learning and its importance",
      "Explored supervised vs unsupervised learning",
      "Discussed practical applications in various industries"
    ],
    participationMetrics: [
      {
        participantId: "student1",
        name: "Alice Johnson",
        totalTimeInMeeting: 5400, // 90 minutes
        engagementScore: 0.85,
        speakingTime: 1200, // 20 minutes
        chatMessages: 12
      },
      {
        participantId: "student2",
        name: "Bob Smith",
        totalTimeInMeeting: 5100, // 85 minutes
        engagementScore: 0.72,
        speakingTime: 600, // 10 minutes
        chatMessages: 8
      },
      {
        participantId: "student3",
        name: "Charlie Brown",
        totalTimeInMeeting: 4800, // 80 minutes
        engagementScore: 0.65,
        speakingTime: 300, // 5 minutes
        chatMessages: 5
      },
      {
        participantId: "student4",
        name: "Diana Prince",
        totalTimeInMeeting: 5400, // 90 minutes
        engagementScore: 0.90,
        speakingTime: 1500, // 25 minutes
        chatMessages: 15
      },
      {
        participantId: "student5",
        name: "Ethan Hunt",
        totalTimeInMeeting: 4500, // 75 minutes
        engagementScore: 0.60,
        speakingTime: 450, // 7.5 minutes
        chatMessages: 6
      }
    ]
  };
}
