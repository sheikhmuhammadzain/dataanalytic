import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

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
            const chunks = [];
            for await (const chunk of req) {
              chunks.push(chunk);
            }
            const data = JSON.parse(Buffer.concat(chunks).toString());
            const { prompt, context } = data;

            // Set headers for SSE
            res.writeHead(200, {
              'Content-Type': 'text/event-stream',
              'Cache-Control': 'no-cache',
              'Connection': 'keep-alive',
            });

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
          } catch (error) {
            console.error('Error:', error);
            res.writeHead(500);
            res.end(JSON.stringify({ error: 'Failed to get chat completion' }));
          }
        } else {
          next();
        }
      },
    ],
  },
});
