'use client';

import { useState, useRef, useEffect } from 'react';
import styles from '../styles/Student.module.css';
import { useRouter } from 'next/navigation';

interface Question {
  id: number;
  question: string;
  response: string;
  timestamp: string;
  subject: string;
  teacher: string;
}

interface StudentProps {
  questions: Question[];
  setQuestions: React.Dispatch<React.SetStateAction<Question[]>>;
}

export default function Student({ questions, setQuestions }: StudentProps) {
  const [question, setQuestion] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [aiResponse, setAiResponse] = useState('');
  const [displayedResponse, setDisplayedResponse] = useState('');
  const [audioUrl, setAudioUrl] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [subject, setSubject] = useState('Computer Science');
  const [teacher, setTeacher] = useState('Dr. Smith');
  const audioRef = useRef<HTMLAudioElement>(null);
  const typingSpeed = 50; // ms per character

  // Cleanup function for blob URLs
  useEffect(() => {
    return () => {
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [audioUrl]);

  // Handle audio play/pause events
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleEnded = () => setIsPlaying(false);

    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('ended', handleEnded);
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setAudioUrl('');
    setIsPlaying(false);

    try {
      // Check if server is available first
      try {
        await fetch('http://127.0.0.1:5000/health', { method: 'GET' });
      } catch (error) {
        throw new Error('Unable to connect to the server. Please make sure the backend server is running.');
      }

      const response = await fetch('http://127.0.0.1:5000/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ question }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        console.error('Server error:', data.error || 'Unknown error');
        setAiResponse(`I apologize, but I encountered an error: ${data.error || 'Unknown error'}. Please try again.`);
        return;
      }
      
      // Always set the response if available
      if (data.response) {
        setAiResponse(data.response);
        typeResponse(data.response);
      }

      // Update subject and teacher if available
      if (data.subject) setSubject(data.subject);
      if (data.teacher) setTeacher(data.teacher);

      // Handle audio if available
      if (data.audio) {
        try {
          const audioData = atob(data.audio);
          const audioArray = new Uint8Array(audioData.length);
          for (let i = 0; i < audioData.length; i++) {
            audioArray[i] = audioData.charCodeAt(i);
          }
          const audioBlob = new Blob([audioArray], { type: 'audio/mp3' });
          const url = URL.createObjectURL(audioBlob);
          setAudioUrl(url);
          
          // Play the audio
          if (audioRef.current) {
            audioRef.current.src = url;
            audioRef.current.play();
          }
        } catch (audioError) {
          console.error('Error processing audio:', audioError);
          // Continue without audio if there's an error
        }
      }

      setQuestion('');
    } catch (error) {
      console.error('Error submitting question:', error);
      setAiResponse('I apologize, but I encountered an error while processing your request. Please try again in a moment.');
    } finally {
      setIsLoading(false);
      setQuestion(''); // Clear the input field regardless of success/failure
    }
  };

  const typeResponse = (text: string) => {
    if (!text) return;
    
    let displayText = '';
    setDisplayedResponse('');
    
    let currentChar = 0;
    const chars = text.split('');
    
    const typingInterval = setInterval(() => {
      if (currentChar < chars.length) {
        displayText += chars[currentChar];
        setDisplayedResponse(displayText);
        currentChar++;
      } else {
        clearInterval(typingInterval);
      }
    }, typingSpeed);
  };

  const router = useRouter();

  return (
    <div className={styles.container}>
      <button 
        className={styles.backButton}
        onClick={() => router.back()}
      >
        ← Back
      </button>
      <div className={styles.classInfo}>
        <span>Subject: {subject}</span>
        <span>Teacher: {teacher}</span>
      </div>

      {aiResponse && (
        <div className={styles.responseContainer}>
          <p className={styles.typingText}>
            {displayedResponse}
            <span className={styles.typingCursor} />
          </p>
        </div>
      )}

      <div className={styles.audioContainer}>
        <div className={`${styles.speechIcon} ${isPlaying ? styles.speaking : ''}`}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
            />
          </svg>
        </div>
        <audio
          ref={audioRef}
          controls
          style={{ display: 'none' }}
        />
      </div>

      <form onSubmit={handleSubmit} className={styles.form}>
        <textarea
          className={styles.input}
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Ask a question about your class or homework..."
          rows={4}
          required
          disabled={isLoading}
        />
        <button
          type="submit"
          className={styles.button}
          disabled={isLoading}
        >
          {isLoading ? 'Processing...' : 'Ask Question'}
        </button>
      </form>
    </div>
  );
}
