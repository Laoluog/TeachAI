import { readFile } from 'fs/promises';
import { SpeechClient } from '@google-cloud/speech';

export class SpeechService {
  private client: SpeechClient;

  constructor() {
    this.client = new SpeechClient();
  }

  async transcribeAudio(filePath: string): Promise<string> {
    try {
      console.log('Starting Google Speech-to-Text transcription...');
      const fileContent = await readFile(filePath);
      
      const audio = {
        content: fileContent.toString('base64'),
      };
      
      const config = {
        encoding: 'MP3',
        sampleRateHertz: 16000,
        languageCode: 'en-US',
      };
      
      const request = {
        audio: audio,
        config: config,
      };

      console.log('Sending request to Google Speech-to-Text...');
      const [response] = await this.client.recognize(request);
      const transcription = response.results
        ?.map(result => result.alternatives?.[0]?.transcript)
        .join('\n');
      
      return transcription || '';
    } catch (error) {
      console.error('Error transcribing with Google Speech-to-Text:', error);
      throw error;
    }
  }
}
