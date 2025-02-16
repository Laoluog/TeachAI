'use client';

import React, { useState } from 'react';
import styles from '../styles/Teacher.module.css';

export default function ZoomMeetingUploader() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadStatus, setUploadStatus] = useState<string>('');

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setUploadStatus('');
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setUploadStatus('Please select a file first');
      return;
    }

    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      setUploadStatus('Uploading...');
      const response = await fetch('/api/zoom/upload-recording', {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        const result = await response.json();
        setUploadStatus(`Upload successful: ${result.message}`);
      } else {
        const errorText = await response.text();
        setUploadStatus(`Upload failed: ${errorText}`);
      }
    } catch (error) {
      console.error('Upload error:', error);
      setUploadStatus('An error occurred during upload');
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h2>Upload Zoom Meeting Recording</h2>
        <div className={styles.fileInput}>
          <input 
            type="file" 
            accept=".m4a,.mp3,.wav" 
            onChange={handleFileChange} 
          />
        </div>
        {selectedFile && (
          <div>
            <p>Selected file: {selectedFile.name}</p>
            <button onClick={handleUpload} className={styles.button}>
              Upload Recording
            </button>
          </div>
        )}
        {uploadStatus && (
          <div className={styles.statusMessage}>
            {uploadStatus}
          </div>
        )}
      </div>
    </div>
  );
}
