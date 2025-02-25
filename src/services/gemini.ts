export async function getChatCompletion(
  prompt: string,
  context: string,
  onChunk: (chunk: string) => void
) {
  try {
    console.log('Starting chat completion request');
    
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'text/event-stream',
      },
      body: JSON.stringify({
        prompt,
        context,
      }),
    });

    console.log('Response status:', response.status);

    if (!response.ok) {
      // Try to get the error message from the response
      let errorMessage;
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorData.details || `HTTP error! status: ${response.status}`;
      } catch (e) {
        errorMessage = `HTTP error! status: ${response.status}`;
      }
      throw new Error(errorMessage);
    }

    if (!response.body) {
      throw new Error('Response body is null');
    }

    const reader = response.body.getReader();
    if (!reader) {
      throw new Error('Failed to get response reader');
    }

    const decoder = new TextDecoder();
    let buffer = '';

    console.log('Starting to read response stream');

    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        console.log('Stream reading complete');
        break;
      }

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.trim() === '') continue;
        
        if (line.startsWith('data: ')) {
          const data = line.slice(5);
          if (data === '[DONE]') {
            console.log('Received [DONE] signal');
            return;
          }
          
          try {
            const parsed = JSON.parse(data);
            if (parsed.content !== undefined) {
              onChunk(parsed.content);
            } else if (parsed.error) {
              console.error('Error from SSE:', parsed.error);
              throw new Error(parsed.error);
            }
          } catch (e) {
            console.error('Error parsing SSE data:', e, 'Raw data:', data);
            // Continue processing other chunks even if one fails
            if (e instanceof Error) {
              if (data.includes('{') || data.includes('[')) {
                console.warn('Possibly malformed JSON in SSE data');
              }
            }
          }
        } else {
          console.warn('Unexpected SSE format:', line);
        }
      }
    }
  } catch (error) {
    console.error("Error getting chat completion:", error);
    
    let errorMessage;
    if (error instanceof Error) {
      errorMessage = error.message;
      // Enhance error message with more detail
      if (error.message.includes('Failed to fetch') || error.stack?.includes('TypeError: Failed to fetch')) {
        errorMessage = 'Failed to connect to API endpoint. Please check your network connection and ensure the server is running.';
      } else if (error.message.includes('404')) {
        errorMessage = 'API endpoint not found (404). Please check if the API server is properly configured.';
      } else if (error.message.toLowerCase().includes('api key')) {
        errorMessage = 'API key issue: ' + error.message;
      }
    } else {
      errorMessage = 'Unknown error during chat completion';
    }
    
    throw new Error(`Chat completion failed: ${errorMessage}`);
  }
} 