'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import styles from '../styles/Home.module.css';

interface HomeProps {
  userRole: string | null;
  setUserRole: (role: string | null) => void;
}

const Home: React.FC<HomeProps> = ({ userRole, setUserRole }) => {
  const router = useRouter();

  const handleRoleSelect = (role: 'student' | 'teacher') => {
    setUserRole(role);
    router.push(`/${role}`);
  };

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <h1 className={styles.title}>Welcome to Teach.AI</h1>
        <p className={styles.description}>
          Experience the future of education with our AI-powered teaching assistant
        </p>
        <div className={styles.roleContainer}>
          <button
            className={`${styles.roleButton} ${userRole === 'student' ? styles.selected : ''}`}
            onClick={() => handleRoleSelect('student')}
          >
            I am a Student
          </button>
          <button
            className={`${styles.roleButton} ${userRole === 'teacher' ? styles.selected : ''}`}
            onClick={() => handleRoleSelect('teacher')}
          >
            I am a Teacher
          </button>
        </div>
      </div>
    </div>
  );
};

export default Home;
