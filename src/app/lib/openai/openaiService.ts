import OpenAI from 'openai';
import { MeetingSummary, ParticipationMetrics } from '../zoom/types';
import { readFile } from 'fs/promises';

export class OpenAIService {
  async transcribeAudio(filePath: string): Promise<string> {
    console.log('Starting audio transcription for file:', filePath);
    try {
      console.log('Reading file...');
      const fileBuffer = await readFile(filePath);
      console.log('File read successfully, size:', fileBuffer.length);

      // Create form data
      console.log('Creating form data...');
      const form = new FormData();
      const blob = new Blob([fileBuffer], { type: 'audio/m4a' });
      form.append('file', blob, 'audio.m4a');
      form.append('model', 'whisper-1');
      form.append('response_format', 'text');
      console.log('Form data created with model: whisper-1');

      console.log('Sending request to OpenAI...');
      const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        body: form,
      });

      console.log('OpenAI response status:', response.status);
      if (!response.ok) {
        const errorText = await response.text();
        console.error('OpenAI error response:', errorText);
        throw new Error(`OpenAI API error: ${response.statusText}. Details: ${errorText}`);
      }

      const text = await response.text();
      return text;
    } catch (error) {
      console.error('Error transcribing audio:', error);
      throw error;
    }
  }

  private openai: OpenAI;

  async analyzeStudent(transcript: string): Promise<any> {
    try {
      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [{
          role: 'system',
          content: 'You are an expert teacher analyzing student performance. Provide insights about language proficiency, participation, and areas for improvement.'
        }, {
          role: 'user',
          content: `Analyze this student's performance from the following transcript:\n\n${transcript}`
        }]
      });

      return completion.choices[0].message.content;
    } catch (error) {
      console.error('Error analyzing student:', error);
      throw error;
    }
  }

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY || '',
      dangerouslyAllowBrowser: true  // Only for client-side usage
    });
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

      Provide a response in JSON format with the following structure:
      {
        "summary": "comprehensive summary of the meeting",
        "keyPoints": ["array", "of", "key", "points"]
      }
    `;

    const completion = await this.openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an expert education analyst that helps teachers understand their class meetings and student engagement."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" }
    });

    const response = JSON.parse(completion.choices[0].message.content);
    return {
      summary: response.summary,
      keyPoints: response.keyPoints,
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

    const completion = await this.openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an expert education analyst that helps teachers understand student engagement and provide actionable insights."
        },
        {
          role: "user",
          content: prompt
        }
      ]
    });

    return completion.choices[0].message.content;
  }
}
