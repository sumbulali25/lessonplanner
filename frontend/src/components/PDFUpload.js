import React, { useRef } from 'react';
import axios from 'axios';

// TEMPORARY: Hardcode your backend URL here for testing
// Replace this with your actual Render backend URL
const API_BASE_URL = 'https://your-backend-url.onrender.com';

function PDFUpload({ setPdfText }) {
  const fileInput = useRef();

  const handleUpload = async (e) => {
    e.preventDefault();
    const file = fileInput.current.files[0];
    if (!file) {
      console.log('No file selected');
      return;
    }
    
    console.log('Uploading file:', file.name);
    console.log('API URL:', API_BASE_URL);
    
    const formData = new FormData();
    formData.append('pdf', file);
    
    try {
      const res = await axios.post(`${API_BASE_URL}/api/upload`, formData);
      console.log('Upload successful:', res.data);
      setPdfText(res.data.text);
    } catch (error) {
      console.error('Upload failed:', error);
      console.error('Error details:', error.response?.data);
      alert('Failed to upload PDF. Check console for details.');
    }
  };

  return (
    <form onSubmit={handleUpload}>
      <label>
        Upload PDF:
        <input type="file" accept="application/pdf" ref={fileInput} />
      </label>
      <button type="submit">Upload</button>
    </form>
  );
}

export default PDFUpload; 