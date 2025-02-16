'use client';

import { useState, useEffect } from 'react';
import styles from '../styles/Teacher.module.css';
import { useRouter } from 'next/navigation';

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

interface File {
  id: number;
  name: string;
  description: string;
  uploadDate: string;
}

interface TeacherProps {
  questions: Question[];
  setQuestions: React.Dispatch<React.SetStateAction<Question[]>>;
}

export default function Teacher({ questions, setQuestions }: TeacherProps) {
  const [activeTab, setActiveTab] = useState('questions');
  const [files, setFiles] = useState<File[]>([]);
  const [chatMessage, setChatMessage] = useState('');
  const [emailRecipient, setEmailRecipient] = useState('');
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [uploadDescription, setUploadDescription] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Fetch questions on component mount
  useEffect(() => {
    fetchQuestions();
  }, []);

  const fetchQuestions = async () => {
    try {
      const response = await fetch('http://127.0.0.1:5000/questions');
      const data = await response.json();
      setQuestions(data);
    } catch (error) {
      console.error('Error fetching questions:', error);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('description', uploadDescription);

    try {
      const response = await fetch('http://127.0.0.1:5000/upload', {
        method: 'POST',
        body: formData,
      });
      if (response.ok) {
        setUploadDescription('');
        // Refresh file list
        const filesResponse = await fetch('http://127.0.0.1:5000/files');
        const filesData = await filesResponse.json();
        setFiles(filesData);
      }
    } catch (error) {
      console.error('Error uploading file:', error);
    }
  };

  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('http://127.0.0.1:5000/teacher/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: chatMessage }),
      });
      const data = await response.json();
      // Handle chat response
      setChatMessage('');
    } catch (error) {
      console.error('Error sending chat message:', error);
    }
  };

  const handleEmailBlast = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('http://127.0.0.1:5000/api/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          // recipient: emailRecipient,
          subject: emailSubject,
          message: emailBody,
        }),
      });
      if (response.ok) {
        setEmailRecipient('');
        setEmailSubject('');
        setEmailBody('');
      }
    } catch (error) {
      console.error('Error sending email blast:', error);
    }
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
      <nav className={styles.nav}>
        <button
          className={`${styles.tabButton} ${activeTab === 'questions' ? styles.active : ''}`}
          onClick={() => setActiveTab('questions')}
        >
          Student Questions
        </button>
        <button
          className={`${styles.tabButton} ${activeTab === 'files' ? styles.active : ''}`}
          onClick={() => setActiveTab('files')}
        >
          File Management
        </button>
        <button
          className={`${styles.tabButton} ${activeTab === 'chat' ? styles.active : ''}`}
          onClick={() => setActiveTab('chat')}
        >
          AI Chat
        </button>
        <button
          className={`${styles.tabButton} ${activeTab === 'email' ? styles.active : ''}`}
          onClick={() => setActiveTab('email')}
        >
          Email Blast
        </button>
      </nav>

      <div className={styles.content}>
        {activeTab === 'questions' && (
          <div className={styles.questions}>
            <h2>Student Questions</h2>
            {questions.map((q) => (
              <div key={q.id} className={styles.questionCard}>
                <div className={styles.questionMeta}>
                  <span>{new Date(q.timestamp).toLocaleString()}</span>
                  <span>{q.subject}</span>
                  <span>{q.teacher}</span>
                  {q.language && !q.language.startsWith('en') && (
                    <span className={styles.language}>{q.language}</span>
                  )}
                </div>
                <p className={styles.questionText}><strong>Q:</strong> {q.question}</p>
                <p className={styles.responseText}><strong>A:</strong> {q.response}</p>
                {q.response_english && q.language && !q.language.startsWith('en') && (
                  <p className={styles.responseEnglish}>
                    <strong>English Translation:</strong> {q.response_english}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}

        {activeTab === 'files' && (
          <div className={styles.files}>
            <h2>File Management</h2>
            <div className={styles.uploadSection}>
              <input
                type="file"
                onChange={handleFileUpload}
                className={styles.fileInput}
              />
              <textarea
                value={uploadDescription}
                onChange={(e) => setUploadDescription(e.target.value)}
                placeholder="File description..."
                className={styles.descriptionInput}
              />
              <button className={styles.uploadButton}>Upload</button>
            </div>
            <div className={styles.fileList}>
              {files.map((file) => (
                <div key={file.id} className={styles.fileCard}>
                  <h3>{file.name}</h3>
                  <p>{file.description}</p>
                  <span>{new Date(file.uploadDate).toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'chat' && (
          <div className={styles.chat}>
            <h2>AI Chat Assistant</h2>
            <form onSubmit={handleChatSubmit} className={styles.chatForm}>
              <textarea
                value={chatMessage}
                onChange={(e) => setChatMessage(e.target.value)}
                placeholder="Ask about student performance, common questions, etc..."
                className={styles.chatInput}
              />
              <button type="submit" className={styles.chatButton}>
                Send
              </button>
            </form>
          </div>
        )}

        {activeTab === 'email' && (
          <div className={styles.email}>
            <h2>Email Blast</h2>
            <form onSubmit={handleEmailBlast} className={styles.emailForm}>
              {/* THIS IS FOR THE SINGLE SEND VERSION, RN WERE GONNA DO MASS SEND */}
              {/* <input 
                type="email"
                value={emailRecipient}
                onChange={(e) => setEmailRecipient(e.target.value)}
                className={styles.emailInput} //this is the same on person
                placeholder="Recipient Email"
                required
              /> */}
              <input
                type="text"
                value={emailSubject}
                onChange={(e) => setEmailSubject(e.target.value)}
                placeholder="Email subject"
                className={styles.emailSubject}
                required
              />
              <textarea
                value={emailBody}
                onChange={(e) => setEmailBody(e.target.value)}
                placeholder="Email content..."
                className={styles.emailBody}
              />
              <button type="submit" className={styles.emailButton}>
                Send to All Students
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
