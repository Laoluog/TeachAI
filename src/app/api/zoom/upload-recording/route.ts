import { NextResponse } from 'next/server';
import { OpenAIService } from '@/app/lib/openai/openaiService';
import { GeminiService } from '@/app/lib/gemini/geminiService';
import { ZoomService } from '@/app/lib/zoom/zoomService';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { cwd } from 'process';

export async function POST(req: Request) {
  console.log('Starting recording upload processing...');
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const meetingId = formData.get('meetingId') as string;
    
    console.log('Received file:', file.name);
    console.log('Meeting ID:', meetingId);

    if (!file || !meetingId) {
      return NextResponse.json(
        { error: 'File and meetingId are required' },
        { status: 400 }
      );
    }

    try {
      // Create uploads directory if it doesn't exist
      const uploadDir = join(cwd(), 'uploads');
      await mkdir(uploadDir, { recursive: true });
      console.log('Created uploads directory:', uploadDir);

      // Save the file temporarily
      const bytes = await file.arrayBuffer();
      const fileBuffer = Buffer.from(bytes);
      const filePath = join(uploadDir, file.name);
      await writeFile(filePath, fileBuffer);
      console.log('Saved file to:', filePath);

      // Initialize services
      console.log('Initializing services...');
      const openAIService = new OpenAIService();
      const geminiService = new GeminiService();
      const zoomService = new ZoomService();

      // Get meeting details
      console.log('Getting meeting details...');
      const meetingDetails = await zoomService.getMeetingDetails(meetingId);
      console.log('Meeting details:', meetingDetails);
      
      // First transcribe with OpenAI
      console.log('Transcribing with OpenAI...');
      const transcript = await openAIService.transcribeAudio(filePath);
      console.log('Transcript:', transcript);
      
      // Get student analysis
      console.log('Analyzing student performance...');
      const analysis = await openAIService.analyzeStudent(transcript);
      console.log('Analysis:', analysis);

      // Create response data
      const responseData = {
        meetingId,
        ...meetingDetails,
        transcript,
        analysis
      };

      return new Response(JSON.stringify(responseData, null, 2), {
        headers: { 'Content-Type': 'application/json' }
      });

    } catch (error) {
      console.error('Error processing recording:', error);
      return NextResponse.json(
        { error: `Failed to process recording: ${error instanceof Error ? error.message : String(error)}` },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error in POST handler:', error);
    return NextResponse.json(
      { error: `Error in POST handler: ${error instanceof Error ? error.message : String(error)}` },
      { status: 500 }
    );
  }
}
