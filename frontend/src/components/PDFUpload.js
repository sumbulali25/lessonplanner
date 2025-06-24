import React, { useRef } from 'react';
import axios from 'axios';

// Use environment variable for API URL, fallback to localhost for development
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

function PDFUpload({ setPdfText }) {
  const fileInput = useRef();

  const handleUpload = async (e) => {
    e.preventDefault();
    const file = fileInput.current.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('pdf', file);
    const res = await axios.post(`${API_BASE_URL}/api/upload`, formData);
    setPdfText(res.data.text);
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