'use client';

import { useState } from 'react';

export default function TeacherPage() {
  const [recipient, setRecipient] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSending(true);
    try {
      const response = await fetch('http://localhost:5000/api/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ recipient, subject, message }),
      });
      if (!response.ok) {
        throw new Error('Failed to send email');
      }
      window.alert('Email sent successfully!');
      // Optionally clear form fields after success
      setRecipient('');
      setSubject('');
      setMessage('');
    } catch (error) {
      console.error('Error sending email:', error);
      window.alert('Error sending email.');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <main style={{ padding: '2rem' }}>
      <h1>Send Email</h1>
      <form
        onSubmit={handleSubmit}
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
          maxWidth: '500px',
          margin: '0 auto',
        }}
      >
        <input
          type="email"
          placeholder="Recipient Email"
          value={recipient}
          onChange={(e) => setRecipient(e.target.value)}
          required
          style={{
            padding: '1rem',
            border: '2px solid #e2e8f0',
            borderRadius: '12px',
            fontSize: '1rem',
            background: 'white',
          }}
        />
        <input
          type="text"
          placeholder="Subject"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          required
          style={{
            padding: '1rem',
            border: '2px solid #e2e8f0',
            borderRadius: '12px',
            fontSize: '1rem',
            background: 'white',
          }}
        />
        <textarea
          placeholder="Message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          required
          rows={4}
          style={{
            padding: '1rem',
            border: '2px solid #e2e8f0',
            borderRadius: '12px',
            fontSize: '1rem',
            background: 'white',
          }}
        />
        <button
          type="submit"
          disabled={isSending}
          style={{
            padding: '1rem 2rem',
            background: 'linear-gradient(135deg, #4a90e2, #805ad5)',
            color: 'white',
            border: 'none',
            borderRadius: '12px',
            fontSize: '1rem',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.3s ease',
          }}
        >
          {isSending ? 'Sending...' : 'Send Email'}
        </button>
      </form>
    </main>
  );
}
