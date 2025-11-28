import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok' });
});

// Main comparison endpoint (placeholder)
app.post('/compare', (req: Request, res: Response) => {
  const { latitude, longitude, items } = req.body;

  // TODO: Implement store discovery and price comparison
  res.json({
    message: 'Comparison endpoint - coming soon',
    received: { latitude, longitude, items }
  });
});

app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});
