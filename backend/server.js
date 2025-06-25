const express = require('express');
const cors = require('cors');
const multer = require('multer');
const pdfParse = require('pdf-parse');
const axios = require('axios');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const fs = require('fs');
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

// Check if Gemini API key is available
if (!process.env.GEMINI_API_KEY) {
  console.error('GEMINI_API_KEY is not set in environment variables');
}

const gemini = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Health check endpoint
app.get('/', (req, res) => {
  res.json({ message: 'Lesson Planner Backend is running!' });
});

// PDF upload and parse endpoint
app.post('/api/upload', upload.single('pdf'), async (req, res) => {
  console.log('Upload endpoint hit');
  console.log('Request headers:', req.headers);
  console.log('Request body keys:', Object.keys(req.body || {}));
  console.log('Request files:', req.files);
  console.log('Request file:', req.file);
  
  if (!req.file) {
    console.log('No file uploaded');
    return res.status(400).json({ error: 'No file uploaded' });
  }
  
  try {
    console.log('File received:', req.file.originalname);
    console.log('File path:', req.file.path);
    console.log('File size:', req.file.size);
    
    // Check if file exists
    if (!fs.existsSync(req.file.path)) {
      throw new Error('Uploaded file not found on disk');
    }
    
    const dataBuffer = fs.readFileSync(req.file.path);
    console.log('File read successfully, size:', dataBuffer.length);
    
    const pdfData = await pdfParse(dataBuffer);
    console.log('PDF parsed successfully, text length:', pdfData.text.length);
    
    // Clean up the uploaded file
    fs.unlinkSync(req.file.path);
    console.log('Uploaded file cleaned up');
    
    res.json({ text: pdfData.text });
  } catch (err) {
    console.error('PDF processing error:', err);
    console.error('Error stack:', err.stack);
    
    // Clean up file if it exists
    if (req.file && req.file.path && fs.existsSync(req.file.path)) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (cleanupErr) {
        console.error('Failed to cleanup file:', cleanupErr);
      }
    }
    
    res.status(500).json({ 
      error: 'Failed to parse PDF', 
      details: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
});

// Fallback lesson plan generator
function generateFallbackLessonPlan(pdfText, answers) {
  const { grade, size, difficulty, time, outcome } = answers;
  
  return `# Lesson Plan

## Grade Level: ${grade}
## Class Size: ${size} students
## Difficulty Level: ${difficulty}
## Duration: ${time} minutes

## Learning Objective
${outcome}

## Materials Needed
- PDF content (provided)
- Writing materials
- Additional resources as needed

## Lesson Structure

### 1. Introduction (5-10 minutes)
- Review the PDF content
- Set learning expectations
- Engage students with key concepts

### 2. Main Activity (${Math.floor(time * 0.6)} minutes)
- Work through the PDF content
- Apply concepts through activities
- Group work or individual practice

### 3. Assessment (${Math.floor(time * 0.2)} minutes)
- Check for understanding
- Provide feedback
- Address any questions

### 4. Conclusion (${Math.floor(time * 0.1)} minutes)
- Summarize key points
- Connect to learning objective
- Preview next steps

## Notes
This lesson plan was generated automatically. Please review and modify as needed for your specific classroom context.

## PDF Content Summary
${pdfText.substring(0, 500)}${pdfText.length > 500 ? '...' : ''}`;
}

// Lesson plan generation endpoint
app.post('/api/generate', async (req, res) => {
  console.log('Generate endpoint hit');
  const { pdfText, answers } = req.body;
  
  if (!pdfText || !answers) {
    return res.status(400).json({ error: 'Missing pdfText or answers' });
  }
  
  // Retry logic for Google API with longer delays
  const maxRetries = 5;
  let lastError;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`Attempt ${attempt} of ${maxRetries}`);
      
      const prompt = `Create a lesson plan based on the following PDF content and teacher's answers.\n\nPDF Content:\n${pdfText}\n\nTeacher's Answers:\n${JSON.stringify(answers, null, 2)}`;
      
      // Try different model names
      let model;
      try {
        model = gemini.getGenerativeModel({ 
          model: 'gemini-1.5-pro',
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 2048,
          }
        });
      } catch (modelError) {
        console.log('Falling back to gemini-1.0-pro');
        model = gemini.getGenerativeModel({ 
          model: 'gemini-1.0-pro',
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 2048,
          }
        });
      }
      
      const result = await model.generateContent(prompt);
      const lessonPlan = result.response.candidates[0].content.parts[0].text;
      console.log('Lesson plan generated successfully');
      return res.json({ lessonPlan });
      
    } catch (err) {
      lastError = err;
      console.error(`Attempt ${attempt} failed:`, err.message);
      
      // Check if it's a retryable error
      if (err.message.includes('retryDelay') || err.message.includes('429') || err.message.includes('503') || err.message.includes('500')) {
        // Extract retry delay from error message if available
        let delay = 0;
        if (err.message.includes('retryDelay')) {
          const match = err.message.match(/"retryDelay":"(\d+)s"/);
          if (match) {
            delay = parseInt(match[1]) * 1000; // Convert to milliseconds
            delay += 2000; // Add 2 seconds buffer
          }
        }
        
        // If no specific delay found, use exponential backoff
        if (delay === 0) {
          delay = Math.pow(2, attempt) * 5000; // 10s, 20s, 40s, 80s, 160s
        }
        
        console.log(`Waiting ${delay}ms before retry...`);
        
        // Don't wait too long on the last attempt
        if (attempt === maxRetries) {
          delay = Math.min(delay, 30000); // Max 30 seconds on last attempt
        }
        
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      } else {
        // Non-retryable error, break immediately
        break;
      }
    }
  }
  
  // All retries failed - provide fallback lesson plan
  console.error('All retry attempts failed, providing fallback lesson plan');
  const fallbackPlan = generateFallbackLessonPlan(pdfText, answers);
  
  res.json({ 
    lessonPlan: fallbackPlan,
    note: 'AI service was temporarily unavailable. This is a basic lesson plan template. Please customize it for your needs.',
    attempts: maxRetries
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`)); 