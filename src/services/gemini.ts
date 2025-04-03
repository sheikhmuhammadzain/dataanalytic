import { GoogleGenerativeAI } from '@google/generative-ai';

export async function getChatCompletion(
  prompt: string,
  context: string,
  onChunk: (chunk: string) => void,
  // Optional: Callback for when streaming is complete
  onComplete?: () => void,
  // Optional: Callback for errors during streaming
  onError?: (error: Error) => void
) {
  try {
    console.log('Starting chat completion stream request');
    
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    
    if (!apiKey) {
      throw new Error('Missing API key. Please check your environment variables.');
    }
    
    console.log('Initializing Gemini API with key');
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
    
    // Create the prompt with context
    const trimmedContext = context.length > 500 ? 
      context.substring(0, 500) + "..." : 
      context;
    
    const fullPrompt = `You are a data analysis assistant. Analyze this dataset: ${trimmedContext}\n\nUser question: ${prompt}\n\nBe concise and focus on key insights.`;
    console.log('Prompt prepared, sending to Gemini API');
    
    // Use streaming API if available
    if (model.generateContentStream) {
      console.log('Using streaming API');
      const result = await model.generateContentStream(fullPrompt);
      
      console.log('Receiving stream from API...');
      
      // Process the stream
      for await (const chunk of result.stream) {
        const chunkText = chunk.text();
        if (chunkText) {
          // Send individual word chunks for better fade effect
          const words = chunkText.split(' ');
          for (const word of words) {
            onChunk(word + ' ');
            // Slow down the streaming with longer delay (100-150ms per word)
            await new Promise(resolve => setTimeout(resolve, 120));
          }
        }
      }
      
      console.log('Stream finished');
      onComplete?.();
    } else {
      // Fallback to non-streaming API with simulated streaming
      console.log('Streaming API not available, using simulated streaming');
      const result = await model.generateContent(fullPrompt);
      const response = await result.response;
      const text = response.text();
      
      console.log('Received response of length:', text.length);
      
      // Split into smaller chunks for better fade effect (3-5 words per chunk)
      const chunks = splitIntoChunks(text, 3);
      
      for (const chunk of chunks) {
        onChunk(chunk);
        // Longer delay between chunks for slower effect (100-150ms)
        await new Promise(resolve => setTimeout(resolve, 120));
      }
      
      onComplete?.();
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
    
    const enhancedError = new Error(`Chat completion failed: ${errorMessage}`);
    
    // Use the error callback if provided, otherwise throw
    if (onError) {
      onError(enhancedError);
    } else {
      throw enhancedError;
    }
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