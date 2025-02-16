import { GoogleGenerativeAI } from '@google/generative-ai';

export class GeminiService {
  private genAI: GoogleGenerativeAI;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('Missing GEMINI_API_KEY environment variable');
    }
    this.genAI = new GoogleGenerativeAI(apiKey);
  }

  async analyzeTranscript(transcript: string): Promise<{ summary: string }> {
    if (!transcript) {
      throw new Error("Transcript cannot be empty.");
    }

    try {
      const model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash'});

      const result = await model.generateContent(
        `Summarize this meeting transcript:\n\n${transcript}`
      );

      // Ensure response has valid content
      if (!result || !result.response || typeof result.response.text !== "function") {
        throw new Error("Invalid response from Gemini API.");
      }

      const text = await result.response.text();
      console.log('Raw response:', text);
      
      try {
        const parsed = JSON.parse(text);
        return { summary: parsed.summary || text };
      } catch {
        return { summary: text.trim() };
      }
    } catch (error) {
      console.error('Gemini API Error:', error);
      throw new Error("Failed to process transcript.");
    }
  }
}
