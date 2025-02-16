'use client';

import { useState } from 'react';
import Teacher from '../components/Teacher';

interface Question {
  id: number;
  question: string;
  response: string;
  timestamp: string;
  subject: string;
  teacher: string;
}

export default function TeacherPage() {
  const [questions, setQuestions] = useState<Question[]>([]);

  return (
    <Teacher questions={questions} setQuestions={setQuestions} />
  );
}
