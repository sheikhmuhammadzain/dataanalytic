import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

const apiKey = process.env.VITE_GEMINI_API_KEY;

if (!apiKey) {
  console.error('Error: VITE_GEMINI_API_KEY is not set in .env file');
  process.exit(1);
}

async function testGeminiAPI() {
  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
    
    console.log('Testing Gemini API connection...');
    
    const result = await model.generateContent('Hello, are you working?');
    const response = await result.response;
    const text = response.text();
    
    console.log('Success! Gemini API Response:', text);
    console.log('API key is valid and working correctly.');
  } catch (error) {
    console.error('Error testing Gemini API:', error.message);
    if (error.message.includes('API key')) {
      console.error('This appears to be an API key issue. Please verify your API key is correct.');
    }
  }
}

testGeminiAPI(); 