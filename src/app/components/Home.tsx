import React from 'react';
import { useNavigate } from 'react-router-dom';
import styles from '../styles/Home.module.css';

interface HomeProps {
  userRole: string | null;
  setUserRole: (role: string | null) => void;
}

const Home: React.FC<HomeProps> = ({ userRole, setUserRole }) => {
  const navigate = useNavigate();

  const handleRoleSelect = (role: 'student' | 'teacher') => {
    setUserRole(role);
    navigate(`/${role}`);
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Welcome to Teach.AI</h1>
      <p className={styles.description}>
        Choose your role to get started
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
  );
};

export default Home;
