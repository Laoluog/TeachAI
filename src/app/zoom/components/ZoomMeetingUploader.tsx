'use client';

import { useState } from 'react';
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
      const response = await fetch('/api/zoom/upload', {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        setUploadStatus('File uploaded successfully!');
        setSelectedFile(null);
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
    <div className={styles.zoomUploader}>
      <h3>Upload Zoom Meeting Recording</h3>
      <input 
        type="file" 
        accept=".mp4,.m4a,.mp3" 
        onChange={handleFileChange} 
        className={styles.fileInput}
      />
      {selectedFile && (
        <div className={styles.fileDetails}>
          <p>Selected File: {selectedFile.name}</p>
          <p>Size: {(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
        </div>
      )}
      <button 
        onClick={handleUpload} 
        disabled={!selectedFile}
        className={styles.uploadButton}
      >
        Upload Meeting
      </button>
      {uploadStatus && (
        <p className={styles.uploadStatus}>{uploadStatus}</p>
      )}
    </div>
  );
}
