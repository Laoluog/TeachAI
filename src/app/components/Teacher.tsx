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

interface StudentProfile {
  id: number;
  name: string;
  avatar: string;
  grade: number;
  participationScore: number;
  taInteractions: number;
  mainLanguage: string;
  attendanceRate: number;
  lastActive: string;
  submittedAssignments: number;
  totalAssignments: number;
  strengths: string[];
  areasForImprovement: string[];
}

interface TeacherProps {
  questions: Question[];
  setQuestions: React.Dispatch<React.SetStateAction<Question[]>>;
}

export default function Teacher({ questions, setQuestions }: TeacherProps) {
  const [activeTab, setActiveTab] = useState('questions');
  // TODO: Replace hardcoded student data with real data from the backend
  // We plan to implement a proper student management system that will:
  // 1. Fetch real-time student data from the database
  // 2. Track actual student interactions and participation
  // 3. Calculate grades and statistics automatically
  // 4. Allow teachers to update student profiles
  // For now, using placeholder data for demonstration purposes
  const [studentProfiles] = useState<StudentProfile[]>([
    {
      id: 1,
      name: 'Laolu Oguneye',
      avatar: '👨🏾‍💻',
      // TODO: Implement automatic grade calculation and participation tracking
      grade: 94.5,
      participationScore: 9.2,
      taInteractions: 15,
      mainLanguage: 'Yoruba',
      attendanceRate: 98,
      // TODO: Implement real-time activity tracking system
      lastActive: '2 hours ago',
      submittedAssignments: 18,
      totalAssignments: 20,
      // TODO: Implement AI-driven skill assessment system
      // Will analyze student code submissions and interactions to automatically identify strengths and areas for improvement
      strengths: ['Algorithm Design', 'Data Structures', 'Problem Solving'],
      areasForImprovement: ['Documentation', 'Test Coverage']
    },
    {
      id: 2,
      name: 'Varun Kute',
      avatar: '👨🏽‍💻',
      // TODO: Implement automatic grade calculation and participation tracking
      grade: 92.8,
      participationScore: 8.9,
      taInteractions: 12,
      mainLanguage: 'Hindi',
      attendanceRate: 95,
      // TODO: Implement real-time activity tracking system
      lastActive: '1 day ago',
      submittedAssignments: 19,
      totalAssignments: 20,
      // TODO: Implement AI-driven skill assessment system
      strengths: ['System Design', 'Backend Development', 'Database Design'],
      areasForImprovement: ['Frontend Polish', 'API Documentation']
    },
    {
      id: 3,
      name: 'Roberto Tamez',
      avatar: '👨🏽‍💻',
      // TODO: Implement automatic grade calculation and participation tracking
      grade: 89.7,
      participationScore: 9.5,
      taInteractions: 18,
      mainLanguage: 'Spanish',
      attendanceRate: 92,
      // TODO: Implement real-time activity tracking system
      lastActive: '3 hours ago',
      submittedAssignments: 17,
      totalAssignments: 20,
      // TODO: Implement AI-driven skill assessment system
      strengths: ['UI/UX Design', 'Frontend Development', 'User Research'],
      areasForImprovement: ['Code Optimization', 'Testing']
    },
    {
      id: 4,
      name: 'Sam Tesfai',
      avatar: '👨🏾‍💻',
      // TODO: Implement automatic grade calculation and participation tracking
      grade: 91.2,
      participationScore: 8.7,
      taInteractions: 14,
      mainLanguage: 'English',
      attendanceRate: 94,
      // TODO: Implement real-time activity tracking system
      lastActive: '5 hours ago',
      submittedAssignments: 18,
      totalAssignments: 20,
      // TODO: Implement AI-driven skill assessment system
      strengths: ['Low-level Programming', 'Performance Optimization', 'Debugging'],
      areasForImprovement: ['Code Documentation', 'Project Planning']
    }
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [emailRecipient, setEmailRecipient] = useState('');
  const [currentMessage, setCurrentMessage] = useState('');
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFileListLoading, setIsFileListLoading] = useState(false);
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [uploadDescription, setUploadDescription] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [assignmentName, setAssignmentName] = useState('');
  const [gradingComments, setGradingComments] = useState('');
  const [gradingFile, setGradingFile] = useState<globalThis.File | null>(null);
  // Add these state variables
  const [gradingResults, setGradingResults] = useState<any>(null);
  const [showResults, setShowResults] = useState(false);
  const [rubricFile, setRubricFile] = useState<globalThis.File | null>(null);
  // Zoom related state
  const [meetingId, setMeetingId] = useState('');
  const [passcode, setPasscode] = useState('');
  const [meetingSummary, setMeetingSummary] = useState('');
  // Teaching Assistant Settings
  const [allowBotAnswers, setAllowBotAnswers] = useState(true);
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('17:00');
  const [maxQuestionsPerDay, setMaxQuestionsPerDay] = useState(10);
  const [allowedSubjects, setAllowedSubjects] = useState(['Math', 'Physics', 'Chemistry', 'Computer Science']);
  const [requireApproval, setRequireApproval] = useState(false);
  const [autoTranslate, setAutoTranslate] = useState(true);
  const [profanityFilter, setProfanityFilter] = useState(true);
  const router = useRouter();

  // Fetch questions, files, and chat history on component mount
  useEffect(() => {
    fetchQuestions();
    loadChatHistory();
    fetchFiles();
    loadTeacherSettings();
  }, []);

  const loadTeacherSettings = async () => {
    try {
      const response = await fetch('http://127.0.0.1:5000/teacher/settings');
      if (!response.ok) throw new Error('Failed to load settings');
      const settings = await response.json();
      
      setAllowBotAnswers(settings.allowBotAnswers);
      setStartTime(settings.startTime);
      setEndTime(settings.endTime);
      setMaxQuestionsPerDay(settings.maxQuestionsPerDay);
      setRequireApproval(settings.requireApproval);
      setAutoTranslate(settings.autoTranslate);
      setProfanityFilter(settings.profanityFilter);
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

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
      
      if (!Array.isArray(data)) {
        console.error('Files data is not an array:', data);
        setFiles([]);
        return;
      }
      
      const processedFiles: File[] = data.map((file: FileResponse) => ({
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
        credentials: 'include',
        headers: {
          'Accept': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Fetched questions:', data);
      
      if (!Array.isArray(data)) {
        console.error('Questions data is not an array:', data);
        setQuestions([]);
        return;
      }
      
      setQuestions(data);
    } catch (error) {
      console.error('Error fetching questions:', error);
      setQuestions([]);
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
      // Update the temporary file's status to ready
      if (tempFile) {
        setFiles(prev => prev.map(f => 
          f.id === tempFile!.id ? {
            ...f,
            status: 'ready'
          } : f
        ));
      }
      
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
          'Accept': 'application/json'
        },
        body: JSON.stringify({ message: currentMessage }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.response) {
        throw new Error('No response received from server');
      }

      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: data.response,
        timestamp: new Date().toISOString()
      };

      setChatHistory(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error sending chat message:', error);
      const errorMessage: ChatMessage = {
        role: 'assistant',
        content: `Error: ${error instanceof Error ? error.message : 'Unknown error occurred'}`,
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
    setIsLoading(true);
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
      setIsLoading(false);
    } catch (error) {
      console.error('Error sending email blast:', error);
      setIsLoading(false);
    }
  };

  const handleGrading = async(e: React.FormEvent) => {
    e.preventDefault();
    
    if (!gradingFile) return;
  
    try {
      const formData = new FormData();
      formData.append('file', gradingFile);
      formData.append('assignmentName', assignmentName);
      formData.append('comments', gradingComments);
      
      // Add rubric if it exists
      if (rubricFile) {
        formData.append('rubric', rubricFile);
      }
  
      const response = await fetch('http://127.0.0.1:5000/grade-input-file', {
        method: 'POST',
        body: formData,
        mode: 'cors',
        credentials: 'include',
        headers: {
          'Accept': 'application/json',
        },
      });
  
      if (response.ok) {
        const data = await response.json();
        setGradingResults(data.results);
        setShowResults(true);
        
        // Clear form
        setGradingFile(null);
        setRubricFile(null);
        setAssignmentName('');
        setGradingComments('');
        
        // Reset file inputs
        const fileInputs = document.querySelectorAll('input[type="file"]') as NodeListOf<HTMLInputElement>;
        fileInputs.forEach(input => input.value = '');
      }
    } catch (error) {
      console.error('Error submitting grading:', error);
    } finally {
      setIsSubmitting(false);
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
          className={`${styles.tabButton} ${activeTab === 'grading' ? styles.active : ''}`}
          onClick={() => setActiveTab('grading')}
        >
          Grading
        </button>
        <button
          className={`${styles.tabButton} ${activeTab === 'settings' ? styles.active : ''}`}
          onClick={() => setActiveTab('settings')}
        >
          Settings
        </button>
        <button
          className={`${styles.tabButton} ${activeTab === 'zoom' ? styles.active : ''}`}
          onClick={() => setActiveTab('zoom')}
        >
          Zoom
        </button>
        <button
          className={`${styles.tabButton} ${activeTab === 'students' ? styles.active : ''}`}
          onClick={() => setActiveTab('students')}
        >
          Students
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
                  className={styles.documentFileInput}
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
              <button 
                type="submit" 
                className={`${styles.emailButton} ${isLoading ? styles.loading : ''}`}
                disabled={isLoading}
              >
                {isLoading ? 'Sending...' : 'Send to All Students'}
              </button>
            </form>
          </div>
        )}
        {activeTab === 'grading' && (
          <div className={styles.grading}>
            <h2>Grading</h2>
            <form onSubmit={handleGrading} className={styles.emailForm} method="POST">
              <div className={styles.uploadSection}>
                <div className={styles.fileInputGroup}>
                  <label>Student Assignment</label>
                  <input
                    type="file"
                    accept=".png,.jpg,.jpeg"
                    onChange={(e) => setGradingFile(e.target.files?.[0] || null)}
                    className={styles.gradingFileInput}
                    required
                  />
                </div>
                
                <div className={styles.fileInputGroup}>
                  <label>Rubric</label>
                  <input
                    type="file"
                    accept=".txt,.pdf,.docx,.png,.jpg,.jpeg"
                    onChange={(e) => setRubricFile(e.target.files?.[0] || null)}
                    className={styles.gradingFileInput}
                  />
                </div>

                <input
                  type="text"
                  value={assignmentName}
                  onChange={(e) => setAssignmentName(e.target.value)}
                  placeholder="Assignment Name"
                  className={styles.emailSubject}
                  required
                />
                <textarea
                  value={gradingComments}
                  onChange={(e) => setGradingComments(e.target.value)}
                  placeholder="Grading comments..."
                  className={styles.emailBody}
                  required
                />
                <button 
                  type="submit" 
                  className={`${styles.emailButton} ${isSubmitting ? styles.loading : ''}`}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Grading...' : 'Submit for Grading'}
                </button>
              </div>
            </form>
            
            {showResults && gradingResults && (
              <div className={styles.gradingResults}>
                <h3>Grading Results</h3>
                <div className={styles.overallScore}>
                  <h4>Overall Score: {(gradingResults.average_score * 100).toFixed(2)}%</h4>
                </div>
                
                <div className={styles.individualResults}>
                  {gradingResults.individual_results?.map((result: any, index: number) => (
                    <div key={index} className={styles.resultCard}>
                      <h4>Question {result.question}</h4>
                      <div className={styles.resultContent}>
                        <p><strong>Student Answer:</strong> {result.student_answer}</p>
                        <p><strong>Correct Answer:</strong> {result.correct_answer}</p>
                        <p><strong>Score:</strong> {(result.score * 100).toFixed(0)}%</p>
                        <p><strong>Explanation:</strong> {result.explanation}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'settings' && (
          <div className={styles.settings}>
            <h2>Settings</h2>
            <div className={styles.settingsContent}>
              <div className={styles.settingSection}>
                <h3>Teaching Assistant Controls</h3>
                <div className={styles.settingItem}>
                  <label className={styles.switchLabel}>
                    <span>Allow AI Assistant Responses</span>
                    <div className={styles.switch}>
                      <input
                        type="checkbox"
                        checked={allowBotAnswers}
                        onChange={(e) => setAllowBotAnswers(e.target.checked)}
                      />
                      <span className={styles.slider}></span>
                    </div>
                  </label>
                </div>

                <div className={styles.settingItem}>
                  <label>Available Hours</label>
                  <div className={styles.timeRange}>
                    <input
                      type="time"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      className={styles.timeInput}
                    />
                    <span>to</span>
                    <input
                      type="time"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      className={styles.timeInput}
                    />
                  </div>
                </div>

                <div className={styles.settingItem}>
                  <label>Maximum Questions per Student (Daily)</label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={maxQuestionsPerDay}
                    onChange={(e) => setMaxQuestionsPerDay(parseInt(e.target.value))}
                    className={styles.settingInput}
                  />
                </div>

                <div className={styles.settingItem}>
                  <label className={styles.switchLabel}>
                    <span>Require Teacher Approval for Answers</span>
                    <div className={styles.switch}>
                      <input
                        type="checkbox"
                        checked={requireApproval}
                        onChange={(e) => setRequireApproval(e.target.checked)}
                      />
                      <span className={styles.slider}></span>
                    </div>
                  </label>
                </div>

                <div className={styles.settingItem}>
                  <label className={styles.switchLabel}>
                    <span>Auto-Translate Responses</span>
                    <div className={styles.switch}>
                      <input
                        type="checkbox"
                        checked={autoTranslate}
                        onChange={(e) => setAutoTranslate(e.target.checked)}
                      />
                      <span className={styles.slider}></span>
                    </div>
                  </label>
                </div>

                <div className={styles.settingItem}>
                  <label className={styles.switchLabel}>
                    <span>Enable Profanity Filter</span>
                    <div className={styles.switch}>
                      <input
                        type="checkbox"
                        checked={profanityFilter}
                        onChange={(e) => setProfanityFilter(e.target.checked)}
                      />
                      <span className={styles.slider}></span>
                    </div>
                  </label>
                </div>
              </div>
              
              <div className={styles.settingSection}>
                <h3>API Configuration</h3>
                <div className={styles.settingItem}>
                  <label>OpenAI API Key</label>
                  <input type="password" placeholder="Enter OpenAI API Key" className={styles.settingInput} />
                </div>
                <div className={styles.settingItem}>
                  <label>ElevenLabs API Key</label>
                  <input type="password" placeholder="Enter ElevenLabs API Key" className={styles.settingInput} />
                </div>
                <div className={styles.settingItem}>
                  <label>Google API Key</label>
                  <input type="password" placeholder="Enter Google API Key" className={styles.settingInput} />
                </div>
              </div>
              
              <div className={styles.settingSection}>
                <h3>Email Settings</h3>
                <div className={styles.settingItem}>
                  <label>SMTP Server</label>
                  <input type="text" placeholder="Enter SMTP Server" className={styles.settingInput} />
                </div>
                <div className={styles.settingItem}>
                  <label>SMTP Port</label>
                  <input type="number" placeholder="Enter SMTP Port" className={styles.settingInput} />
                </div>
                <div className={styles.settingItem}>
                  <label>Email Username</label>
                  <input type="email" placeholder="Enter Email Username" className={styles.settingInput} />
                </div>
                <div className={styles.settingItem}>
                  <label>Email Password</label>
                  <input type="password" placeholder="Enter Email Password" className={styles.settingInput} />
                </div>
              </div>

              <button 
                className={`${styles.saveButton} ${isLoading ? styles.loading : ''}`}
                onClick={async () => {
                  setIsLoading(true);
                  try {
                    const response = await fetch('http://127.0.0.1:5000/teacher/settings', {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                      },
                      body: JSON.stringify({
                        allowBotAnswers,
                        startTime,
                        endTime,
                        maxQuestionsPerDay,
                        requireApproval,
                        autoTranslate,
                        profanityFilter,
                      }),
                    });
                    
                    if (!response.ok) throw new Error('Failed to save settings');
                    // Show success message
                  } catch (error) {
                    console.error('Error saving settings:', error);
                  } finally {
                    setIsLoading(false);
                  }
                }}
                disabled={isLoading}
              >
                {isLoading ? 'Saving...' : 'Save Settings'}
              </button>
            </div>
          </div>
        )}

        {activeTab === 'students' && (
          <div className={styles.studentsTab}>
            <h2>Student Statistics</h2>
            <div className={styles.studentGrid}>
              {studentProfiles.map(student => (
                <div key={student.id} className={styles.studentCard}>
                  <div className={styles.studentHeader}>
                    <span className={styles.studentAvatar}>{student.avatar}</span>
                    <h3>{student.name}</h3>
                    <span className={styles.lastActive}>Last active: {student.lastActive}</span>
                  </div>
                  
                  <div className={styles.studentStats}>
                    <div className={styles.statItem}>
                      <span className={styles.statLabel}>Grade</span>
                      <span className={styles.statValue}>{student.grade}%</span>
                    </div>
                    <div className={styles.statItem}>
                      <span className={styles.statLabel}>Participation</span>
                      <span className={styles.statValue}>{student.participationScore}/10</span>
                    </div>
                    <div className={styles.statItem}>
                      <span className={styles.statLabel}>TA Interactions</span>
                      <span className={styles.statValue}>{student.taInteractions}</span>
                    </div>
                    <div className={styles.statItem}>
                      <span className={styles.statLabel}>Main Language</span>
                      <span className={styles.statValue}>{student.mainLanguage}</span>
                    </div>
                    <div className={styles.statItem}>
                      <span className={styles.statLabel}>Attendance</span>
                      <span className={styles.statValue}>{student.attendanceRate}%</span>
                    </div>
                    <div className={styles.statItem}>
                      <span className={styles.statLabel}>Assignments</span>
                      <span className={styles.statValue}>{student.submittedAssignments}/{student.totalAssignments}</span>
                    </div>
                  </div>

                  <div className={styles.studentSkills}>
                    <div className={styles.skillSection}>
                      <h4>Strengths</h4>
                      <div className={styles.skillTags}>
                        {student.strengths.map((strength, index) => (
                          <span key={index} className={`${styles.skillTag} ${styles.strengthTag}`}>
                            {strength}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className={styles.skillSection}>
                      <h4>Areas for Improvement</h4>
                      <div className={styles.skillTags}>
                        {student.areasForImprovement.map((area, index) => (
                          <span key={index} className={`${styles.skillTag} ${styles.improvementTag}`}>
                            {area}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'zoom' && (
          <div className={styles.zoomTab}>
            <h2>Zoom Meeting</h2>
            <div className={styles.zoomForm}>
              <div className={styles.formGroup}>
                <label htmlFor="meetingId">Meeting ID:</label>
                <input
                  type="text"
                  id="meetingId"
                  value={meetingId}
                  onChange={(e) => setMeetingId(e.target.value)}
                  placeholder="Enter Zoom meeting ID"
                  className={styles.zoomInput}
                />
              </div>
              <div className={styles.formGroup}>
                <label htmlFor="passcode">Passcode:</label>
                <input
                  type="text"
                  id="passcode"
                  value={passcode}
                  onChange={(e) => setPasscode(e.target.value)}
                  placeholder="Enter meeting passcode"
                  className={styles.zoomInput}
                />
              </div>
              <button 
                className={`${styles.zoomButton} ${isLoading ? styles.loading : ''}`}
                disabled={isLoading || !meetingId.trim() || !passcode.trim()}
                onClick={async (e) => {
                  e.preventDefault();
                  setIsLoading(true);
                  try {
                    // Simulate network delay
                    await new Promise(resolve => setTimeout(resolve, 1000));
                    
                    const response = await fetch('http://127.0.0.1:5000/zoom/meeting-summary', {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                      },
                      body: JSON.stringify({
                        meetingId,
                        passcode,
                      }),
                    });

                    if (!response.ok) {
                      throw new Error('Failed to fetch meeting summary');
                    }

                    const data = await response.json();
                    setMeetingSummary(data.summary);
                    setPasscode('');
                    setMeetingId('');
                  } catch (error) {
                    console.error('Error processing Zoom recording:', error);
                    setMeetingSummary('Failed to process meeting recording. Please try again.');
                  } finally {
                    setIsLoading(false);
                  }
                }}
              >
                {isLoading ? 'Processing...' : 'Watch Recording'}
              </button>
            </div>

            <div className={styles.meetingSummary}>
              <h3>Meeting Summary</h3>
              <div className={styles.summaryContent}>
                {meetingSummary ? (
                  meetingSummary
                ) : (
                  <p className={styles.placeholder}>Meeting summary will appear here after the session...</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
