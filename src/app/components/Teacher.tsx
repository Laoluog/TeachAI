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

interface FileResponse {
  id: number;
  name: string;
  filename?: string;
  description: string;
  uploadDate?: string;
  upload_date?: string;
  fileType?: string;
  file_type?: string;
}

interface File {
  id: number;
  name: string;
  description: string;
  uploadDate: string;
  fileType: string;
  status: 'processing' | 'ready' | 'error';
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
  const [currentMessage, setCurrentMessage] = useState('');
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFileListLoading, setIsFileListLoading] = useState(false);
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [uploadDescription, setUploadDescription] = useState('');
  const router = useRouter();

  // Fetch questions, files, and chat history on component mount
  useEffect(() => {
    fetchQuestions();
    loadChatHistory();
    fetchFiles();
  }, []);

  const fetchFiles = async () => {
    setIsFileListLoading(true);
    try {
      const response = await fetch('http://127.0.0.1:5000/document/files', {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Fetched files:', data);
      
      if (!Array.isArray(data.files)) {
        console.error('Files data is not an array:', data);
        setFiles([]);
        return;
      }
      
      const processedFiles: File[] = data.files.map((file: FileResponse) => ({
        id: file.id,
        name: file.name || file.filename || 'Unnamed file',
        description: file.description || '',
        uploadDate: file.uploadDate || file.upload_date || new Date().toISOString(),
        fileType: file.fileType || file.file_type || 'unknown',
        status: 'ready' as const
      }));
      
      setFiles(processedFiles);
    } catch (error) {
      console.error('Error fetching files:', error);
      setFiles([]);
    } finally {
      setIsFileListLoading(false);
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
    if (!file) {
      console.log('No file selected');
      return;
    }

    // Check file type
    const fileType = file.name.split('.').pop()?.toLowerCase();
    const allowedTypes = ['pdf', 'txt', 'doc', 'docx'];
    
    console.log('File type:', fileType);
    
    if (!fileType || !allowedTypes.includes(fileType)) {
      alert(`File type not supported. Please upload: ${allowedTypes.join(', ')}`);
      return;
    }

    // Create temporary file object
    let tempFile: File | null = null;

    try {
      setIsLoading(true);
      
      // Initialize temporary file with processing status
      tempFile = {
        id: Date.now(),
        name: file.name,
        description: uploadDescription,
        uploadDate: new Date().toISOString(),
        fileType,
        status: 'processing'
      };
      
      setFiles(prev => [tempFile!, ...prev]);

      console.log('Starting file upload:', {
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        description: uploadDescription
      });
      
      const formData = new FormData();
      formData.append('file', file);
      formData.append('description', uploadDescription);
      
      const response = await fetch('http://127.0.0.1:5000/document/upload', {
        method: 'POST',
        body: formData,
        headers: {
          'Accept': 'application/json'
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Upload successful:', data);
      
      setUploadDescription('');
      // Remove processing file and fetch updated list
      if (tempFile) {
        setFiles(prev => prev.filter(f => f.id !== tempFile!.id));
      }
      await fetchFiles();
      
    } catch (error) {
      console.error('Error uploading file:', error);
      // Update file status to error if tempFile exists
      if (tempFile) {
        setFiles(prev => prev.map(f => 
          f.id === tempFile!.id ? {
            ...f,
            status: 'error',
            error: error instanceof Error ? error.message : 'Network error'
          } : f
        ));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentMessage.trim()) return;

    const userMessage: ChatMessage = {
      role: 'user',
      content: currentMessage,
      timestamp: new Date().toISOString()
    };

    setChatHistory(prev => [...prev, userMessage]);
    setCurrentMessage('');
    setIsLoading(true);

    try {
      const response = await fetch('http://127.0.0.1:5000/teacher/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: currentMessage }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: data.response || 'Sorry, I could not process your request.',
        timestamp: new Date().toISOString()
      };

      setChatHistory(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error sending chat message:', error);
      const errorMessage: ChatMessage = {
        role: 'assistant',
        content: 'Sorry, there was an error processing your message. Please try again.',
        timestamp: new Date().toISOString()
      };
      setChatHistory(prev => [...prev, errorMessage]);
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
        <button
          className={`${styles.tabButton} ${activeTab === 'settings' ? styles.active : ''}`}
          onClick={() => setActiveTab('email')}
        >
          Settings
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
              <textarea
                value={uploadDescription}
                onChange={(e) => setUploadDescription(e.target.value)}
                placeholder="File description..."
                className={styles.descriptionInput}
                disabled={isLoading}
              />
              <div className={styles.fileInputWrapper}>
                <input
                  type="file"
                  onChange={handleFileUpload}
                  accept=".txt,.pdf,.doc,.docx"
                  className={styles.fileInput}
                  disabled={isLoading}
                />
                {isLoading && (
                  <div className={styles.loadingOverlay}>
                    <span>Uploading and processing document...</span>
                  </div>
                )}
              </div>
            </div>
            <div className={styles.fileList}>
              {isFileListLoading ? (
                <div className={styles.loadingContainer}>
                  <div className={styles.loadingSpinner} />
                  <span>Loading files...</span>
                </div>
              ) : files.length === 0 ? (
                <div className={styles.emptyState}>
                  <span>No files uploaded yet</span>
                </div>
              ) : (
                files.map((file) => (
                  <div key={file.id} className={`${styles.fileCard} ${file.status === 'error' ? styles.error : ''}`}>
                    <div className={styles.fileHeader}>
                      <h3>{file.name}</h3>
                      <span className={`${styles.fileStatus} ${styles[file.status]}`}>
                        {file.status === 'processing' ? 'Processing...' :
                         file.status === 'error' ? 'Error' :
                         'Ready'}
                      </span>
                    </div>
                    <p className={styles.fileDescription}>{file.description}</p>
                    {file.error && (
                      <p className={styles.errorMessage}>{file.error}</p>
                    )}
                    <div className={styles.fileFooter}>
                      <span className={styles.fileType}>{file.fileType}</span>
                      <span className={styles.uploadDate}>
                        {new Date(file.uploadDate).toLocaleString()}
                      </span>
                    </div>
                  </div>
                ))
              )}
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
                value={currentMessage}
                onChange={(e) => setCurrentMessage(e.target.value)}
                placeholder="Ask about student performance, common questions, etc..."
                className={styles.chatInput}
                disabled={isLoading}
              />
              <button
                type="submit"
                className={styles.chatButton}
                disabled={isLoading || !currentMessage.trim()}
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
      </div>
    </div>
  );
}
