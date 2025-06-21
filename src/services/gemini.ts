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
          // Enhanced word-by-word streaming with natural timing
          const words = chunkText.split(/(\s+)/); // Keep whitespace
          for (const word of words) {
            if (word.trim()) {
              onChunk(word);
              // Variable delay based on word length and punctuation for more natural feel
              let delay = 30; // Base delay
              
              // Longer delay after punctuation
              if (/[.!?]$/.test(word.trim())) {
                delay = 150;
              } else if (/[,;:]$/.test(word.trim())) {
                delay = 80;
              } else if (word.length > 6) {
                delay = 50; // Slightly longer for long words
              }
              
              await new Promise(resolve => setTimeout(resolve, delay));
            } else if (word.includes(' ')) {
              onChunk(word); // Send whitespace immediately
            }
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
      const chunks = splitIntoChunks(text, 1); // One word per chunk for consistency
      
      for (const chunk of chunks) {
        onChunk(chunk + ' ');
        // Enhanced timing matching the streaming version
        let delay = 30;
        
        if (/[.!?]$/.test(chunk.trim())) {
          delay = 150;
        } else if (/[,;:]$/.test(chunk.trim())) {
          delay = 80;
        } else if (chunk.length > 6) {
          delay = 50;
        }
        
        await new Promise(resolve => setTimeout(resolve, delay));
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

export async function generateSyntheticPaintsData(): Promise<Record<string, string | number | null>[]> {
  try {
    console.log('Generating synthetic paints company data...');
    
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    
    if (!apiKey) {
      throw new Error('Missing API key. Please check your environment variables.');
    }
    
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    
    const prompt = `Generate realistic synthetic data for a paints manufacturing company. Create a CSV dataset with at least 50-100 rows and the following columns:

1. Product_ID (string) - Unique identifier like "PAINT-001", "PAINT-002", etc.
2. Product_Name (string) - Paint product names like "Premium White", "Ocean Blue", etc.
3. Category (string) - Paint categories like "Interior", "Exterior", "Primer", "Specialty"
4. Color (string) - Color names like "White", "Blue", "Red", "Green", etc.
5. Price_Per_Liter (number) - Price in dollars, range $15-80
6. Stock_Quantity (number) - Number of liters in stock, range 50-2000
7. Manufacturing_Date (string) - Dates in YYYY-MM-DD format from last 2 years
8. Supplier (string) - Supplier company names like "ChemCorp", "ColorTech", etc.
9. Quality_Rating (number) - Rating from 1-5 with decimal precision
10. Sales_Last_Month (number) - Units sold last month, range 10-500
11. Region (string) - Geographic regions like "North", "South", "East", "West"
12. Volume_Size (string) - Container sizes like "1L", "5L", "10L", "20L"

Requirements:
- Generate exactly 75 rows of data
- Use realistic paint industry data
- Make sure numeric values are reasonable for a paint company
- Include variety in all categorical fields
- Return ONLY the CSV data with headers, no explanations or markdown formatting
- Use comma separation
- No quotes around values unless they contain commas

Example first few rows:
Product_ID,Product_Name,Category,Color,Price_Per_Liter,Stock_Quantity,Manufacturing_Date,Supplier,Quality_Rating,Sales_Last_Month,Region,Volume_Size
PAINT-001,Premium White,Interior,White,25.50,450,2024-03-15,ChemCorp,4.2,125,North,5L
PAINT-002,Ocean Blue,Exterior,Blue,32.75,320,2024-02-28,ColorTech,4.5,89,South,10L

Generate the complete dataset now:`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const csvText = response.text().trim();
    
    console.log('Generated CSV data:', csvText.substring(0, 500) + '...');
    
    // Parse CSV data into array of objects
    const lines = csvText.split('\n').filter(line => line.trim());
    if (lines.length < 2) {
      throw new Error('Generated data does not contain enough rows');
    }
    
    const headers = lines[0].split(',').map(h => h.trim());
    const data: Record<string, string | number | null>[] = [];
    
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim());
      if (values.length !== headers.length) continue;
      
      const row: Record<string, string | number | null> = {};
      headers.forEach((header, index) => {
        let value: string | number | null = values[index];
        
        // Convert numeric columns to numbers
        if (header === 'Price_Per_Liter' || header === 'Stock_Quantity' || 
            header === 'Quality_Rating' || header === 'Sales_Last_Month') {
          const numValue = parseFloat(value as string);
          value = isNaN(numValue) ? null : numValue;
        }
        
        row[header] = value;
      });
      data.push(row);
    }
    
    console.log(`Successfully generated ${data.length} rows of synthetic paints data`);
    return data;
    
  } catch (error) {
    console.error("Error generating synthetic data:", error);
    
    // Fallback data if AI generation fails
    console.log('Using fallback synthetic data...');
    return generateFallbackPaintsData();
  }
}

function generateFallbackPaintsData(): Record<string, string | number | null>[] {
  const categories = ['Interior', 'Exterior', 'Primer', 'Specialty'];
  const colors = ['White', 'Blue', 'Red', 'Green', 'Yellow', 'Black', 'Gray', 'Brown', 'Pink', 'Purple'];
  const suppliers = ['ChemCorp', 'ColorTech', 'PaintPro', 'MixMasters', 'ChromaSupply'];
  const regions = ['North', 'South', 'East', 'West', 'Central'];
  const volumes = ['1L', '5L', '10L', '20L'];
  
  const paintNames = [
    'Premium White', 'Ocean Blue', 'Forest Green', 'Sunset Red', 'Golden Yellow',
    'Midnight Black', 'Steel Gray', 'Cream Beige', 'Sky Blue', 'Deep Purple',
    'Bright Orange', 'Rose Pink', 'Charcoal Gray', 'Lime Green', 'Burgundy Red'
  ];
  
  const data: Record<string, string | number | null>[] = [];
  
  for (let i = 1; i <= 75; i++) {
    const manufactureDate = new Date(2023 + Math.random(), Math.floor(Math.random() * 12), 1 + Math.floor(Math.random() * 28));
    
    data.push({
      Product_ID: `PAINT-${i.toString().padStart(3, '0')}`,
      Product_Name: paintNames[Math.floor(Math.random() * paintNames.length)],
      Category: categories[Math.floor(Math.random() * categories.length)],
      Color: colors[Math.floor(Math.random() * colors.length)],
      Price_Per_Liter: Math.round((15 + Math.random() * 65) * 100) / 100,
      Stock_Quantity: Math.floor(50 + Math.random() * 1950),
      Manufacturing_Date: manufactureDate.toISOString().split('T')[0],
      Supplier: suppliers[Math.floor(Math.random() * suppliers.length)],
      Quality_Rating: Math.round((1 + Math.random() * 4) * 10) / 10,
      Sales_Last_Month: Math.floor(10 + Math.random() * 490),
      Region: regions[Math.floor(Math.random() * regions.length)],
      Volume_Size: volumes[Math.floor(Math.random() * volumes.length)]
    });
  }
  
  return data;
} 