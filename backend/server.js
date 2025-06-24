const express = require('express');
const cors = require('cors');
const multer = require('multer');
const pdfParse = require('pdf-parse');
const axios = require('axios');
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const app = express();
const upload = multer({ dest: 'uploads/' });

app.use(cors());
app.use(express.json());

const gemini = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// PDF upload and parse endpoint
app.post('/api/upload', upload.single('pdf'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  try {
    const dataBuffer = require('fs').readFileSync(req.file.path);
    const pdfData = await pdfParse(dataBuffer);
    res.json({ text: pdfData.text });
  } catch (err) {
    res.status(500).json({ error: 'Failed to parse PDF' });
  }
});

// Lesson plan generation endpoint
app.post('/api/generate', async (req, res) => {
  const { pdfText, answers } = req.body;
  try {
    const prompt = `Create a lesson plan based on the following PDF content and teacher's answers.\n\nPDF Content:\n${pdfText}\n\nTeacher's Answers:\n${JSON.stringify(answers, null, 2)}`;
    const model = gemini.getGenerativeModel({ model: 'gemini-pro' });
    const result = await model.generateContent(prompt);
    const lessonPlan = result.response.candidates[0].content.parts[0].text;
    res.json({ lessonPlan });
  } catch (err) {
    res.status(500).json({ error: 'Failed to generate lesson plan', details: err.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`)); 