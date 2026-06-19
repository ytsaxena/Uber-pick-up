import express from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

async function startServer() {
  const app = express();
  app.use(express.json());

  // Gemini Setup
  const apiKey = process.env.GEMINI_API_KEY;
  const ai = apiKey ? new GoogleGenAI({
    apiKey: apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  }) : null;

  // AI assistant route (Contextual Pickup Guide)
  app.post('/api/assistant', async (req, res) => {
    try {
      const { message, scenarioContext } = req.body;
      if (!ai) {
        return res.json({
          text: `[Demo Mode] Gemini API key is not configured. Here is the local simulation response:

To reach your designated **${scenarioContext.locationName}** pickup spot:
1. Walk toward **Exit Gate 3** (your closest exit point).
2. Move straight for **12 meters** towards Column 10.
3. Your selected destination is **Hub A (designate spot)**. It's handicap accessible, has low congestion, and your driver's ETA is approximately ${Math.round(scenarioContext.driver.etaSeconds / 60)} minutes.
4. Keep an eye out for landmark **Starbucks**, which is 15m away at bearing 45 degrees. Your driver is approaching Column 10 from the main outer lane.
          
*Note: Set the GEMINI_API_KEY environment secret in Google AI Studio to enable fully creative contextual AI interactions!*`
        });
      }

      const prompt = `You are "Uber Find My Ride Helper" — an AI-powered co-pilot built to solve transit pickup confusion in crowded areas. 
      Your task is to guide the user step-by-step from their current context to their designated smart hub pickup spot. If they ask about landmarks, explain where they are relative to the hub.
      
      Here is the rich location context:
      - Complex Location: ${scenarioContext.locationName} (${scenarioContext.type})
      - Selected Spot (Smart Hub): ${scenarioContext.selectedHub?.name || 'Hub A'} (Located near ${scenarioContext.selectedHub?.landmark || 'Columns'}). Walk time: ${scenarioContext.selectedHub?.walkingTimeSec || 45}s. Distance: ${scenarioContext.selectedHub?.distanceMeters || 35}m. 
      - Smart Hubs Available: ${JSON.stringify(scenarioContext.hubs)}
      - Surrounding landmarks (360 view): ${JSON.stringify(scenarioContext.landmarks360)}
      - Close Exits: ${JSON.stringify(scenarioContext.exits)}
      - Driver State: ${scenarioContext.driver.name} is driving a ${scenarioContext.driver.car} (License Plate: ${scenarioContext.driver.plate}) with an ETA of ${Math.round(scenarioContext.driver.etaSeconds)}s.
      
      Requirements:
      1. Keep your reply direct, warm, and highly practical (2-4 sentences or short bullets).
      2. Use bolding for landmarks (e.g., **Starbucks**) and pickup spots (e.g., **Hub A**).
      3. Focus strictly on navigation and reassuring the customer. Avoid technical jargon or metadata.
      4. Answer the user's specific request: "${message}"`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
      });

      res.json({ text: response.text });
    } catch (err: any) {
      console.error('Error in AI assistant endpoint:', err);
      res.status(500).json({ error: err.message || 'Internal connection error to AI service' });
    }
  });

  // Serve static files / Vite middleware
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(process.cwd(), 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(process.cwd(), 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  }

  const port = 3000;
  app.listen(port, '0.0.0.0', () => {
    console.log(`[Uber Find My Ride] Full-stack server running on http://0.0.0.0:${port}`);
  });
}

startServer();
