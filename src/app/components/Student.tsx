'use client';

import { useState, useRef, useEffect } from 'react';
import styles from '../styles/Student.module.css';
import { useRouter } from 'next/navigation';

interface Language {
  code: string;
  name: string;
  flag?: string;
}

const SUPPORTED_LANGUAGES: Language[] = [
  { code: 'en-US', name: 'English (USA)' },
  { code: 'en-GB', name: 'English (UK)', flag: '🇬🇧' },
  { code: 'en-AU', name: 'English (Australia)', flag: '🇦🇺' },
  { code: 'en-CA', name: 'English (Canada)', flag: '🇨🇦' },
  { code: 'ja', name: 'Japanese', flag: '🇯🇵' },
  { code: 'zh', name: 'Chinese', flag: '🇨🇳' },
  { code: 'de', name: 'German', flag: '🇩🇪' },
  { code: 'hi', name: 'Hindi', flag: '🇮🇳' },
  { code: 'fr-FR', name: 'French (France)', flag: '🇫🇷' },
  { code: 'fr-CA', name: 'French (Canada)', flag: '🇨🇦' },
  { code: 'ko', name: 'Korean', flag: '🇰🇷' },
  { code: 'pt-BR', name: 'Portuguese (Brazil)', flag: '🇧🇷' },
  { code: 'pt-PT', name: 'Portuguese (Portugal)', flag: '🇵🇹' },
  { code: 'it', name: 'Italian', flag: '🇮🇹' },
  { code: 'es-ES', name: 'Spanish (Spain)', flag: '🇪🇸' },
  { code: 'es-MX', name: 'Spanish (Mexico)', flag: '🇲🇽' },
  { code: 'id', name: 'Indonesian', flag: '🇮🇩' },
  { code: 'nl', name: 'Dutch', flag: '🇳🇱' },
  { code: 'tr', name: 'Turkish', flag: '🇹🇷' },
  { code: 'fil', name: 'Filipino', flag: '🇵🇭' },
  { code: 'pl', name: 'Polish', flag: '🇵🇱' },
  { code: 'sv', name: 'Swedish', flag: '🇸🇪' },
  { code: 'bg', name: 'Bulgarian', flag: '🇧🇬' },
  { code: 'ro', name: 'Romanian', flag: '🇷🇴' },
  { code: 'ar-SA', name: 'Arabic (Saudi Arabia)', flag: '🇸🇦' },
  { code: 'ar-AE', name: 'Arabic (UAE)', flag: '🇦🇪' },
  { code: 'cs', name: 'Czech', flag: '🇨🇿' },
  { code: 'el', name: 'Greek', flag: '🇬🇷' },
  { code: 'fi', name: 'Finnish', flag: '🇫🇮' },
  { code: 'hr', name: 'Croatian', flag: '🇭🇷' },
  { code: 'ms', name: 'Malay', flag: '🇲🇾' },
  { code: 'sk', name: 'Slovak', flag: '🇸🇰' },
  { code: 'da', name: 'Danish', flag: '🇩🇰' },
  { code: 'ta', name: 'Tamil', flag: '🇮🇳' },
  { code: 'uk', name: 'Ukrainian', flag: '🇺🇦' },
  { code: 'ru', name: 'Russian', flag: '🇷🇺' },
];

interface Question {
  id: number;
  question: string;
  response: string;
  response_english?: string;
  timestamp: string;
  subject: string;
  teacher: string;
  language?: string;
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
  const [selectedLanguage, setSelectedLanguage] = useState<Language>(SUPPORTED_LANGUAGES[0]);
  const [isLanguageDropdownOpen, setIsLanguageDropdownOpen] = useState(false);
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
        body: JSON.stringify({ 
          question,
          language: selectedLanguage.code
        }),
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
      <div className={styles.topBar}>
        <div className={styles.classInfo}>
          <span>Subject: {subject}</span>
          <span>Teacher: {teacher}</span>
          <span>Student: Varun Kute</span>
        </div>
        <div className={styles.languageSelector}>
          <button
            className={styles.languageButton}
            onClick={() => setIsLanguageDropdownOpen(!isLanguageDropdownOpen)}
          >
            {selectedLanguage.flag && (
              <span className={styles.flag}>{selectedLanguage.flag}</span>
            )}
            {selectedLanguage.name}
          </button>
          {isLanguageDropdownOpen && (
            <div className={styles.languageDropdown}>
              {SUPPORTED_LANGUAGES.map((lang) => (
                <div
                  key={lang.code}
                  className={styles.languageOption}
                  onClick={() => {
                    setSelectedLanguage(lang);
                    setIsLanguageDropdownOpen(false);
                  }}
                >
                  {lang.flag && <span className={styles.flag}>{lang.flag}</span>}
                  {lang.name}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {aiResponse && (
        <div className={styles.responseContainer}>
          <p className={styles.typingText}>
            {displayedResponse}
            <span className={styles.typingCursor} />
          </p>
        </div>
      )}

      <audio ref={audioRef} style={{ display: 'none' }} controls />

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
