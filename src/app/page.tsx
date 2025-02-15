'use client';

import { useState, useRef, useEffect } from 'react';
import styles from './page.module.css';

export default function Home() {
  const [question, setQuestion] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [aiResponse, setAiResponse] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const videoRef = useRef<HTMLVideoElement>(null);

  // Cleanup function for blob URLs
  useEffect(() => {
    return () => {
      if (videoUrl) {
        URL.revokeObjectURL(videoUrl);
      }
    };
  }, [videoUrl]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ question }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit question');
      }

      const data = await response.json();
      
      // Update AI response text
      setAiResponse(data.response);

      // Convert video data to blob and create URL
      const videoData = atob(data.video);
      const videoArray = new Uint8Array(videoData.length);
      for (let i = 0; i < videoData.length; i++) {
        videoArray[i] = videoData.charCodeAt(i);
      }
      const videoBlob = new Blob([videoArray], { type: 'video/mp4' });
      const url = URL.createObjectURL(videoBlob);
      
      // Update video source and play
      setVideoUrl(url);
      if (videoRef.current) {
        videoRef.current.src = url;
        videoRef.current.play();
      }

      // Reset the form
      setQuestion('');
    } catch (error) {
      console.error('Error submitting question:', error);
      setAiResponse('An error occurred while processing your request.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className={styles.main}>
      <div className={styles.container}>
        <h1 className={styles.title}>AI Teaching Assistant</h1>
        
        <div className={styles.videoContainer}>
          <video
            ref={videoRef}
            className={styles.video}
            controls
            playsInline
          >
            Your browser does not support the video tag.
          </video>
        </div>

        {aiResponse && (
          <div className={styles.responseText}>
            <h2>Response:</h2>
            <p>{aiResponse}</p>
          </div>
        )}

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
    </main>
  );
}
