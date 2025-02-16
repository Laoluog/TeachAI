'use client';

import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import styles from './page.module.css';
import Student from './components/Student';
import Teacher from './components/Teacher';
import Home from './components/Home';

export default function App() {
  const [userRole, setUserRole] = useState<string | null>(null);
  interface Question {
    id: number;
    question: string;
    response: string;
    timestamp: string;
    subject: string;
    teacher: string;
  }

  const [questions, setQuestions] = useState<Question[]>([]);

  // Load user role from localStorage
  useEffect(() => {
    const savedRole = localStorage.getItem('userRole');
    if (savedRole) {
      setUserRole(savedRole);
    }
  }, []);

  // Save user role to localStorage
  useEffect(() => {
    if (userRole) {
      localStorage.setItem('userRole', userRole);
    }
  }, [userRole]);

  // Load questions from localStorage
  useEffect(() => {
    const savedQuestions = localStorage.getItem('questions');
    if (savedQuestions) {
      setQuestions(JSON.parse(savedQuestions));
    }
  }, []);

  // Save questions to localStorage
  useEffect(() => {
    localStorage.setItem('questions', JSON.stringify(questions));
  }, [questions]);

  return (
    <Router>
      <main className={styles.main}>
        <Routes>
          <Route 
            path="/" 
            element={
              <Home 
                userRole={userRole} 
                setUserRole={setUserRole} 
              />
            } 
          />
          <Route 
            path="/student" 
            element={
              <Student 
                questions={questions} 
                setQuestions={setQuestions} 
              />
            } 
          />
          <Route 
            path="/teacher" 
            element={
              <Teacher 
                questions={questions} 
                setQuestions={setQuestions} 
              />
            } 
          />
          <Route path="*" element={<h1>404 NOT FOUND</h1>} />
        </Routes>
      </main>
    </Router>
  );
}
