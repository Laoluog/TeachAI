import OpenAI from 'openai';
import { MeetingSummary, ParticipationMetrics } from '../zoom/types';

export class OpenAIService {
  private openai: OpenAI;

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY || '',
      dangerouslyAllowBrowser: true
    });
  }

  async analyzeMeetingTranscript(transcript: string): Promise<{
    studentObjectives: string[];
    teacherObjectives: string[];
    meetingEffectiveness: number;
    overallFeedback: string;
  }> {
    const prompt = `
      Carefully analyze the following meeting transcript. Distinguish between student and teacher dialogue, 
      identify learning objectives, and assess the meeting's effectiveness.

      Transcript:
      ${transcript}

      Provide a detailed analysis in the following JSON format:
      {
        "studentObjectives": [
          "Specific objective 1 discussed by student",
          "Specific objective 2 discussed by student"
        ],
        "teacherObjectives": [
          "Specific objective 1 set by teacher",
          "Specific objective 2 set by teacher"
        ],
        "meetingEffectiveness": 0-100, // Percentage score of meeting productivity
        "overallFeedback": "Comprehensive summary of the meeting's quality and key insights"
      }
    `;

    try {
      const completion = await this.openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are an expert educational analyst who can deeply analyze meeting transcripts, " +
                     "distinguishing between student and teacher dialogue, and providing nuanced insights " +
                     "into learning objectives and meeting effectiveness."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        response_format: { type: "json_object" }
      });

      // Parse the response
      const response = JSON.parse(completion.choices[0].message.content || '{}');
      return {
        studentObjectives: response.studentObjectives || [],
        teacherObjectives: response.teacherObjectives || [],
        meetingEffectiveness: response.meetingEffectiveness || 0,
        overallFeedback: response.overallFeedback || "Unable to generate detailed feedback"
      };
    } catch (error) {
      console.error('Error analyzing meeting transcript:', error);
      throw error;
    }
  }

  async transcribeAudio(filePath: string): Promise<string> {
    console.log('Starting audio transcription for file:', filePath);
    try {
      const fileBuffer = await fetch(filePath);
      const blob = await fileBuffer.blob();

      const form = new FormData();
      form.append('file', blob, 'audio.m4a');
      form.append('model', 'whisper-1');
      form.append('response_format', 'text');

      const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        body: form,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`OpenAI API error: ${response.statusText}. Details: ${errorText}`);
      }

      return await response.text();
    } catch (error) {
      console.error('Error transcribing audio:', error);
      throw error;
    }
  }
}
