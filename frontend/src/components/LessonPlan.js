import React from 'react';

function LessonPlan({ lessonPlan }) {
  return (
    <div style={{ marginTop: '2rem', padding: '1rem', border: '1px solid #ccc' }}>
      <h2>Generated Lesson Plan</h2>
      <pre style={{ whiteSpace: 'pre-wrap' }}>{lessonPlan}</pre>
    </div>
  );
}

export default LessonPlan; 