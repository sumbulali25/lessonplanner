const express = require('express');
const cors = require('cors');
const multer = require('multer');
const pdfParse = require('pdf-parse');
const axios = require('axios');
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const app = express();
const upload = multer({ dest: 'uploads/' });

// Configure CORS to allow all origins
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

const gemini = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Health check endpoint
app.get('/', (req, res) => {
  res.json({ message: 'Lesson Planner Backend is running!' });
});

// PDF upload and parse endpoint
app.post('/api/upload', upload.single('pdf'), async (req, res) => {
  console.log('Upload endpoint hit');
  if (!req.file) {
    console.log('No file uploaded');
    return res.status(400).json({ error: 'No file uploaded' });
  }
  try {
    console.log('File received:', req.file.originalname);
    const dataBuffer = require('fs').readFileSync(req.file.path);
    const pdfData = await pdfParse(dataBuffer);
    console.log('PDF parsed successfully');
    res.json({ text: pdfData.text });
  } catch (err) {
    console.error('PDF parsing error:', err);
    res.status(500).json({ error: 'Failed to parse PDF', details: err.message });
  }
});

// Lesson plan generation endpoint
app.post('/api/generate', async (req, res) => {
  console.log('Generate endpoint hit');
  const { pdfText, answers } = req.body;
  try {
    const prompt = `Create a lesson plan based on the following PDF content and teacher's answers.\n\nPDF Content:\n${pdfText}\n\nTeacher's Answers:\n${JSON.stringify(answers, null, 2)}`;
    const model = gemini.getGenerativeModel({ model: 'gemini-pro' });
    const result = await model.generateContent(prompt);
    const lessonPlan = result.response.candidates[0].content.parts[0].text;
    console.log('Lesson plan generated successfully');
    res.json({ lessonPlan });
  } catch (err) {
    console.error('Lesson plan generation error:', err);
    res.status(500).json({ error: 'Failed to generate lesson plan', details: err.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`)); 