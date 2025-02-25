import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { GoogleGenerativeAI } from '@google/generative-ai';
import type { ViteDevServer } from 'vite';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, process.cwd(), '');
  
  return {
    plugins: [react()],
    optimizeDeps: {
      exclude: ['lucide-react'],
    },
    server: {
      port: 5173,
      strictPort: true,
      proxy: {
        // Fallback for direct API requests
        '/api': {
          target: 'http://localhost:5173',
          changeOrigin: false,
          configure: (proxy, options) => {
            // This is just a placeholder to ensure the proxy middleware gets initialized
          }
        }
      },
      configureServer: (server: ViteDevServer) => {
        // Add CORS middleware
        server.middlewares.use((req, res, next) => {
          res.setHeader('Access-Control-Allow-Origin', '*');
          res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
          res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
          
          if (req.method === 'OPTIONS') {
            res.statusCode = 204;
            res.end();
            return;
          }
          
          next();
        });

        // Add chat API middleware
        server.middlewares.use(async (req, res, next) => {
          // Match both /api/chat and /api/chat/ paths
          if (req.url && (req.url === '/api/chat' || req.url.startsWith('/api/chat?') || req.url.startsWith('/api/chat/'))) {
            console.log('Handling API request:', req.url, req.method);
            
            try {
              const apiKey = env.VITE_GEMINI_API_KEY;
              
              if (!apiKey) {
                throw new Error('VITE_GEMINI_API_KEY is not set');
              }

              // Read the request body
              let body = '';
              for await (const chunk of req) {
                body += chunk.toString();
              }
              
              let prompt, context;
              try {
                const parsedBody = JSON.parse(body);
                prompt = parsedBody.prompt;
                context = parsedBody.context;
              } catch (parseError) {
                console.error('Error parsing request body:', parseError, 'Raw body:', body);
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ 
                  error: 'Invalid JSON in request body',
                  details: parseError.message 
                }));
                return;
              }

              if (!prompt || !context) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ 
                  error: 'Missing required fields',
                  details: 'Both prompt and context are required'
                }));
                return;
              }

              // Set headers for SSE
              res.writeHead(200, {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive',
                'Access-Control-Allow-Origin': '*'
              });

              // Send an initial message to confirm connection
              res.write(`data: ${JSON.stringify({ content: "" })}\n\n`);

              try {
                // Initialize Gemini AI for each request
                const genAI = new GoogleGenerativeAI(apiKey);
                
                // Get the generative model
                const model = genAI.getGenerativeModel({ 
                  model: 'gemini-pro',
                  generationConfig: {
                    temperature: 0.7,
                    topP: 0.8,
                    topK: 40,
                  },
                });

                // Start the chat
                const chat = model.startChat({
                  history: [
                    {
                      role: "user",
                      parts: [{ text: `You are a data analysis assistant. You help users understand their CSV data. Here's the context about the current data: ${context}` }],
                    },
                  ],
                  generationConfig: {
                    temperature: 0.7,
                    topP: 0.8,
                    topK: 40,
                  },
                });

                // Send the message and stream the response
                const result = await chat.sendMessageStream([
                  { text: prompt }
                ]);

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
                res.write(`data: ${JSON.stringify({ error: 'AI Error: ' + aiError.message })}\n\n`);
                res.end();
              }
            } catch (error) {
              console.error('Error handling request:', error);
              res.writeHead(500, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ 
                error: 'Failed to get chat completion',
                details: error.message 
              }));
            }
          } else {
            next();
          }
        });
      },
    },
    define: {
      'process.env.VITE_GEMINI_API_KEY': JSON.stringify(env.VITE_GEMINI_API_KEY),
    },
  };
});
