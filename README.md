# Lesson Planner

An AI-powered lesson planner for teachers. Upload a PDF, answer a few questions, and get a custom lesson plan generated by AI.

## Features
- PDF upload
- AI-driven questions (grade, student size, difficulty, etc.)
- Lesson plan generation using AI

## Project Structure
- `frontend/` – React app for UI
- `backend/` – Node.js/Express server for PDF parsing and AI integration

## Setup Instructions

### 1. Backend
```
cd backend
npm install
cp .env.example .env # Add your OpenAI API key
npm start
```

### 2. Frontend
```
cd frontend
npm install
npm start
```

### 3. Usage
- Go to `http://localhost:3000` in your browser.
- Upload a PDF, answer the questions, and generate your lesson plan! 