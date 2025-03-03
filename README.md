# Data Analytics Dashboard

A modern data analytics dashboard built with React, Vite, and Google's Gemini AI. Upload CSV files and analyze your data with AI-powered insights.

## Features

- CSV file upload and parsing
- Data visualization with charts
- AI-powered data analysis chat
- Column statistics and summaries
- Interactive data filtering
- Responsive design

## Tech Stack

- Frontend: React, TypeScript, Tailwind CSS
- Development Server: Vite
- AI: Google Generative AI (Gemini)
- Charts: Recharts
- State Management: Zustand
- CSV Parsing: Papa Parse

## Development

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file with your Gemini API key:
   ```
   VITE_GEMINI_API_KEY=your_api_key_here
   ```
4. Start the development server:
   ```bash
   npm run dev
   ```
   This will start the Vite development server with hot module replacement.

5. For production build:
   ```bash
   npm run build
   npm run preview
   ```

## Deployment to Netlify

### Option 1: Deploy via Netlify UI

1. Build the project locally:
   ```bash
   npm run build
   ```

2. Drag and drop the `dist` folder to Netlify's upload section.

3. Add your environment variables in Netlify's UI:
   - Key: `VITE_GEMINI_API_KEY`
   - Value: Your Gemini API key

### Option 2: Deploy via Git

1. Push your code to a Git repository (GitHub, GitLab, etc.)

2. In Netlify:
   - Create a new site from Git
   - Connect to your repository
   - Set the build command to: `npm run build`
   - Set the publish directory to: `dist`
   - Add your environment variables:
     - Key: `VITE_GEMINI_API_KEY`
     - Value: Your Gemini API key

3. Click "Deploy site"

## Troubleshooting Deployment

If you encounter MIME type errors:
- The project includes a `netlify.toml` and `_headers` file that should handle MIME type configurations
- If issues persist, check Netlify's documentation on handling MIME types for SPAs
- Ensure the build command and publish directory are correctly set in Netlify

## License

MIT

 