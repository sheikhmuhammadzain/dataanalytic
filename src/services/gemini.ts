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
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    
    // Improved context handling - allow more context and smart truncation
    const maxContextLength = 4000; // Increased from 500 to 4000 characters
    let processedContext = context;
    
    if (context.length > maxContextLength) {
      // Smart truncation: keep beginning and end, truncate middle if needed
      const keepStart = Math.floor(maxContextLength * 0.7); // Keep 70% from start
      const keepEnd = Math.floor(maxContextLength * 0.3); // Keep 30% from end
      
      if (keepStart + keepEnd < context.length) {
        processedContext = context.substring(0, keepStart) + 
          "\n...(data truncated for brevity)...\n" + 
          context.substring(context.length - keepEnd);
      }
    }
    
    // Enhanced prompt structure for better data analysis
    const fullPrompt = `You are an expert data analyst. You have access to a CSV dataset with the following information:

${processedContext}

Instructions for analysis:
- Answer questions about the data based on the provided dataset summary and statistics
- Provide specific insights using the actual column names and values from the data
- When discussing trends or patterns, reference the statistical information provided
- If asked about data that isn't in the summary, explain what information is available
- Use clear, concise language and provide actionable insights
- Format responses with bullet points or numbered lists when appropriate

User Question: ${prompt}

Please analyze the data and provide a helpful response:`;

    console.log('Enhanced prompt prepared, sending to Gemini API');
    console.log('Context length:', processedContext.length, 'characters');
    
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
            // Slightly faster streaming for better UX
            await new Promise(resolve => setTimeout(resolve, 80));
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
        // Faster simulated streaming
        await new Promise(resolve => setTimeout(resolve, 80));
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
      } else if (error.message.includes('quota') || error.message.includes('limit')) {
        errorMessage = 'API quota exceeded. Please check your Gemini API usage limits.';
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