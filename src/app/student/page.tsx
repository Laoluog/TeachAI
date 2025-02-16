'use client';

import { useState } from 'react';
import Student from '../components/Student';

interface Question {
  id: number;
  question: string;
  response: string;
  timestamp: string;
  subject: string;
  teacher: string;
}

export default function StudentPage() {
  const [questions, setQuestions] = useState<Question[]>([]);

  return (
    <Student questions={questions} setQuestions={setQuestions} />
  );
}
