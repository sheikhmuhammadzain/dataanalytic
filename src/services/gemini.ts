import { GoogleGenerativeAI } from '@google/generative-ai';

export async function getChatCompletion(
  prompt: string,
  context: string,
  onChunk: (chunk: string) => void
) {
  try {
    console.log('Starting chat completion request');
    
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    
    if (!apiKey) {
      throw new Error('Missing API key. Please check your environment variables.');
    }
    
    console.log('Initializing Gemini API with key');
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
    
    // Create the prompt with context
    const trimmedContext = context.length > 500 ? 
      context.substring(0, 500) + "..." : 
      context;
    
    const fullPrompt = `You are a data analysis assistant. Analyze this dataset: ${trimmedContext}\n\nUser question: ${prompt}\n\nBe concise and focus on key insights.`;
    console.log('Prompt prepared, sending to Gemini API');
    
    // Use the generateContent method
    const result = await model.generateContent(fullPrompt);
    const response = await result.response;
    const text = response.text();
    
    console.log('Received response of length:', text.length);
    
    // Simulate streaming by delivering the content in chunks
    const chunks = splitIntoChunks(text, 15);
    
    for (const chunk of chunks) {
      onChunk(chunk);
      // Add a small delay between chunks to simulate streaming
      await new Promise(resolve => setTimeout(resolve, 15));
    }
  } catch (error) {
    console.error("Error getting chat completion:", error);
    
    let errorMessage = 'Unknown error during chat completion';
    
    if (error instanceof Error) {
      errorMessage = error.message;
      
      // Enhance error message with more detail
      if (error.message.includes('Failed to fetch') || error.stack?.includes('TypeError: Failed to fetch')) {
        errorMessage = 'Failed to connect to Gemini API. Please check your network connection.';
      } else if (error.message.toLowerCase().includes('api key')) {
        errorMessage = 'API key issue: ' + error.message;
      }
    }
    
    throw new Error(`Chat completion failed: ${errorMessage}`);
  }
}

// Helper function to split text into chunks
function splitIntoChunks(text: string, maxWords: number): string[] {
  const words = text.split(' ');
  const chunks: string[] = [];
  
  for (let i = 0; i < words.length; i += maxWords) {
    chunks.push(words.slice(i, i + maxWords).join(' '));
  }
  
  return chunks;
} 