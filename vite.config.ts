import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { GoogleGenerativeAI } from '@google/generative-ai';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  server: {
    middleware: [
      async (req, res, next) => {
        if (req.url === '/api/chat') {
          try {
            const apiKey = process.env.VITE_GEMINI_API_KEY;
            if (!apiKey) {
              throw new Error('VITE_GEMINI_API_KEY is not set');
            }

            const chunks = [];
            for await (const chunk of req) {
              chunks.push(chunk);
            }
            const data = JSON.parse(Buffer.concat(chunks).toString());
            const { prompt, context } = data;

            if (!prompt || !context) {
              throw new Error('Missing required fields: prompt or context');
            }

            // Set headers for SSE
            res.writeHead(200, {
              'Content-Type': 'text/event-stream',
              'Cache-Control': 'no-cache',
              'Connection': 'keep-alive',
            });

            try {
              // Initialize Gemini AI for each request
              const genAI = new GoogleGenerativeAI(apiKey);
              
              // Get the generative model
              const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

              // Start the chat
              const chat = model.startChat({
                history: [
                  {
                    role: "user",
                    parts: `You are a data analysis assistant. You help users understand their CSV data. Here's the context about the current data: ${context}`,
                  },
                ],
              });

              // Send the message and stream the response
              const result = await chat.sendMessageStream(prompt);

              for await (const chunk of result.stream) {
                const content = chunk.text();
                if (content) {
                  res.write(`data: ${JSON.stringify({ content })}\n\n`);
                }
              }

              res.write('data: [DONE]\n\n');
              res.end();
            } catch (aiError) {
              console.error('AI Error:', aiError);
              res.write(`data: ${JSON.stringify({ error: aiError.message })}\n\n`);
              res.end();
            }
          } catch (error) {
            console.error('Error:', error);
            res.writeHead(500);
            res.end(JSON.stringify({ 
              error: 'Failed to get chat completion',
              details: error.message 
            }));
          }
        } else {
          next();
        }
      },
    ],
  },
});
