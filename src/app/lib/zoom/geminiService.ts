import { GoogleGenerativeAI } from '@google/generative-ai';
import { MeetingSummary, ParticipationMetrics } from './types';

export class GeminiService {
  private genAI: GoogleGenerativeAI;
  private model: any;

  constructor(apiKey: string) {
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-pro' });
  }

  async generateMeetingSummary(
    transcript: string,
    participationMetrics: ParticipationMetrics[]
  ): Promise<Partial<MeetingSummary>> {
    const prompt = `
      Analyze this meeting transcript and participation data to create a comprehensive summary.
      Focus on:
      1. Main topics discussed
      2. Key decisions made
      3. Action items
      4. Student participation patterns
      5. Areas for improvement in student engagement

      Transcript:
      ${transcript}

      Participation Data:
      ${JSON.stringify(participationMetrics, null, 2)}
    `;

    const result = await this.model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Parse the summary into structured data
    const summary = this.parseSummaryResponse(text);

    return {
      summary: summary.mainSummary,
      keyPoints: summary.keyPoints,
    };
  }

  async generateStudentInsights(
    studentMetrics: ParticipationMetrics,
    historicalData: ParticipationMetrics[]
  ): Promise<string> {
    const prompt = `
      Analyze this student's participation patterns and provide insights:
      
      Current Meeting Metrics:
      ${JSON.stringify(studentMetrics, null, 2)}

      Historical Data:
      ${JSON.stringify(historicalData, null, 2)}

      Provide insights on:
      1. Participation trends
      2. Engagement patterns
      3. Specific recommendations for improvement
      4. Areas of strength
    `;

    const result = await this.model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  }

  private parseSummaryResponse(text: string): { mainSummary: string; keyPoints: string[] } {
    // Basic parsing - could be made more sophisticated
    const lines = text.split('\n');
    const keyPoints = lines
      .filter(line => line.trim().startsWith('-') || line.trim().startsWith('•'))
      .map(line => line.trim().replace(/^[-•]\s*/, ''));

    const mainSummary = lines
      .filter(line => !line.trim().startsWith('-') && !line.trim().startsWith('•'))
      .join('\n')
      .trim();

    return {
      mainSummary,
      keyPoints,
    };
  }
}
