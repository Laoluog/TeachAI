'use client';

import { useState } from 'react';

export default function TeacherPage() {
  const [status, setStatus] = useState<string>('');
  const [isSending, setIsSending] = useState<boolean>(false);

  const sendEmail = async () => {
    setIsSending(true);
    setStatus('');
    try {
      // Call your email API endpoint.
      // This could be a Next.js API route that forwards the request to your Flask backend,
      // or you could call the Flask endpoint directly if CORS is configured.
      const response = await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // You can include email parameters in the request body if needed.
        body: JSON.stringify({
          recipient: 'jrtamezvillarreal@gmail.com',
          subject: 'Test Email',
          message: 'This is a test email sent from the teacher page.',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send email');
      }

      setStatus('Email sent successfully!');
    } catch (error) {
      console.error('Error sending email:', error);
      setStatus('Error sending email.');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <main style={{ padding: '2rem' }}>
      <h1>Teacher Page</h1>
      <p>Click the button below to send an email.</p>
      <button onClick={sendEmail} disabled={isSending}>
        {isSending ? 'Sending...' : 'Send Email'}
      </button>
      {status && <p>{status}</p>}
    </main>
  );
}
