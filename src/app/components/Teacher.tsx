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
  fileType?: string;
  status?: 'processing' | 'ready' | 'error';
  error?: string;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

interface TeacherProps {
  questions: Question[];
  setQuestions: React.Dispatch<React.SetStateAction<Question[]>>;
}

export default function Teacher({ questions, setQuestions }: TeacherProps) {
  const [activeTab, setActiveTab] = useState('questions');
  const [files, setFiles] = useState<File[]>([]);
  const [chatMessage, setChatMessage] = useState('');
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [uploadDescription, setUploadDescription] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Fetch questions, files, and chat history on component mount
  useEffect(() => {
    fetchQuestions();
    loadChatHistory();
    fetchFiles();
  }, []);

  const fetchFiles = async () => {
    try {
      const response = await fetch('http://127.0.0.1:5000/document/files', {
        credentials: 'include',
        mode: 'cors',
        headers: {
          'Accept': 'application/json'
        }
      });
      const data = await response.json();
      setFiles(data);
    } catch (error) {
      console.error('Error fetching files:', error);
    }
  };

  // Load chat history from localStorage
  const loadChatHistory = () => {
    const savedHistory = localStorage.getItem('teacherChatHistory');
    if (savedHistory) {
      setChatHistory(JSON.parse(savedHistory));
    }
  };

  // Save chat history to localStorage
  useEffect(() => {
    localStorage.setItem('teacherChatHistory', JSON.stringify(chatHistory));
  }, [chatHistory]);

  const fetchQuestions = async () => {
    try {
      const response = await fetch('http://127.0.0.1:5000/questions', {
        credentials: 'include',
        mode: 'cors',
        headers: {
          'Accept': 'application/json'
        }
      });
      const data = await response.json();
      setQuestions(data);
    } catch (error) {
      console.error('Error fetching questions:', error);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file type
    const fileType = file.name.split('.').pop()?.toLowerCase();
    const allowedTypes = ['pdf', 'txt', 'doc', 'docx'];
    
    if (!fileType || !allowedTypes.includes(fileType)) {
      alert(`File type not supported. Please upload: ${allowedTypes.join(', ')}`);
      return;
    }

    // Add file to list immediately with processing status
    const tempFile = {
      id: Date.now(), // Temporary ID
      name: file.name,
      description: uploadDescription,
      uploadDate: new Date().toISOString(),
      fileType,
      status: 'processing' as const
    };
    setFiles(prev => [tempFile, ...prev]);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('description', uploadDescription);

    try {
      setIsLoading(true);
      const response = await fetch('http://127.0.0.1:5000/document/upload', {
        method: 'POST',
        body: formData,
        credentials: 'include',
        mode: 'cors',
        headers: {
          'Accept': 'application/json'
        }
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setUploadDescription('');
        // Refresh files list
        fetchFiles();
      } else {
        // Update file status to error
        setFiles(prev => prev.map(f => 
          f.id === tempFile.id ? {
            ...f,
            status: 'error',
            error: data.error || 'Upload failed'
          } : f
        ));
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      // Update file status to error
      setFiles(prev => prev.map(f => 
        f.id === tempFile.id ? {
          ...f,
          status: 'error',
          error: 'Network error'
        } : f
      ));
    } finally {
      setIsLoading(false);
    }
  };

  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatMessage.trim()) return;

    setIsLoading(true);
    try {
      const response = await fetch('http://127.0.0.1:5000/teacher/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: chatMessage }),
      });
      const data = await response.json();
      
      if (data.history) {
        setChatHistory(data.history);
      }
      
      setChatMessage('');
    } catch (error) {
      console.error('Error sending chat message:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const clearChat = async () => {
    try {
      await fetch('http://127.0.0.1:5000/teacher/chat/clear', {
        method: 'POST',
      });
      setChatHistory([]);
      localStorage.removeItem('teacherChatHistory');
    } catch (error) {
      console.error('Error clearing chat history:', error);
    }
  };

  const handleEmailBlast = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('http://127.0.0.1:5000/teacher/email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subject: emailSubject,
          body: emailBody,
        }),
      });
      if (response.ok) {
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
            <h2 className={styles.sectionHeader}>Student Questions</h2>
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
            <h2 className={styles.sectionHeader}>File Management</h2>
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
            <div className={styles.chatHeader}>
              <h2 className={styles.sectionHeader}>AI Chat Assistant</h2>
              <button
                onClick={clearChat}
                className={styles.clearChatButton}
                type="button"
              >
                Clear Chat
              </button>
            </div>
            <div className={styles.chatMessages}>
              {chatHistory.map((msg, index) => (
                <div
                  key={index}
                  className={`${styles.message} ${msg.role === 'user' ? styles.userMessage : styles.assistantMessage}`}
                >
                  <div className={styles.messageContent}>{msg.content}</div>
                  <div className={styles.messageTime}>
                    {new Date(msg.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className={styles.loading}>AI is thinking...</div>
              )}
            </div>
            <form onSubmit={handleChatSubmit} className={styles.chatForm}>
              <textarea
                value={chatMessage}
                onChange={(e) => setChatMessage(e.target.value)}
                placeholder="Ask about student performance, common questions, etc..."
                className={styles.chatInput}
                disabled={isLoading}
              />
              <button
                type="submit"
                className={styles.chatButton}
                disabled={isLoading || !chatMessage.trim()}
              >
                {isLoading ? 'Sending...' : 'Send'}
              </button>
            </form>
          </div>
        )}

        {activeTab === 'email' && (
          <div className={styles.email}>
            <h2 className={styles.sectionHeader}>Email Blast</h2>
            <form onSubmit={handleEmailBlast} className={styles.emailForm}>
              <input
                type="text"
                value={emailSubject}
                onChange={(e) => setEmailSubject(e.target.value)}
                placeholder="Email subject"
                className={styles.emailSubject}
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
        {activeTab === 'email' && (
          <div className={styles.email}>
            <h2 className={styles.sectionHeader}>Settings</h2>
            <form onSubmit={handleEmailBlast} className={styles.emailForm}>
              <input
                type="text"
                value={emailSubject}
                onChange={(e) => setEmailSubject(e.target.value)}
                placeholder="Email subject"
                className={styles.emailSubject}
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
