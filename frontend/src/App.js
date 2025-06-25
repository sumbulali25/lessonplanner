import React, { useState } from 'react';
import PDFUpload from './components/PDFUpload';
import QuestionForm from './components/QuestionForm';
import LessonPlan from './components/LessonPlan';

// Use environment variable for API URL, fallback to localhost for development
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

function App() {
  const [pdfText, setPdfText] = useState('');
  const [answers, setAnswers] = useState(null);
  const [lessonPlan, setLessonPlan] = useState('');

  // Debug: Log the API URL being used
  console.log('App using API URL:', API_BASE_URL);

  return (
    <div style={{ maxWidth: 600, margin: '2rem auto', fontFamily: 'sans-serif' }}>
      <h1>AI Lesson Planner</h1>
      {!pdfText && <PDFUpload setPdfText={setPdfText} />}
      {pdfText && !answers && <QuestionForm setAnswers={setAnswers} />}
      {pdfText && answers && !lessonPlan && (
        <button
          onClick={async () => {
            try {
              console.log('Generating lesson plan...');
              const res = await fetch(`${API_BASE_URL}/api/generate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ pdfText, answers })
              });
              const data = await res.json();
              console.log('Lesson plan generated:', data);
              setLessonPlan(data.lessonPlan);
            } catch (error) {
              console.error('Failed to generate lesson plan:', error);
              alert('Failed to generate lesson plan. Check console for details.');
            }
          }}
        >
          Generate Lesson Plan
        </button>
      )}
      {lessonPlan && <LessonPlan lessonPlan={lessonPlan} />}
    </div>
  );
}

export default App; 