import React, { useState } from 'react';

function QuestionForm({ setAnswers }) {
  const [form, setForm] = useState({
    grade: '',
    size: '',
    difficulty: '',
    time: '',
    outcome: ''
  });

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = e => {
    e.preventDefault();
    setAnswers(form);
  };

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label>Grade Level: <input name="grade" value={form.grade} onChange={handleChange} required /></label>
      </div>
      <div>
        <label>Student Group Size: <input name="size" value={form.size} onChange={handleChange} required /></label>
      </div>
      <div>
        <label>Difficulty Level: <input name="difficulty" value={form.difficulty} onChange={handleChange} required /></label>
      </div>
      <div>
        <label>Lesson Time (minutes): <input name="time" value={form.time} onChange={handleChange} required /></label>
      </div>
      <div>
        <label>Desired Outcome: <input name="outcome" value={form.outcome} onChange={handleChange} required /></label>
      </div>
      <button type="submit">Next</button>
    </form>
  );
}

export default QuestionForm; 