import 'dotenv/config';
import express, { Request, Response } from 'express';
import cors from 'cors';
import type { CompareRequest, CompareResponse, ErrorResponse } from '@grocery-price-finder/types';
import { storeDiscoveryService } from './services/storeDiscoveryService';
import { aggregationService } from './services/aggregationService';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Main comparison endpoint
app.post('/compare', async (req: Request, res: Response<CompareResponse | ErrorResponse>) => {
  try {
    const { latitude, longitude, items }: CompareRequest = req.body;

    // Validate request
    if (!latitude || !longitude || !items || !Array.isArray(items)) {
      res.status(400).json({
        error: 'Bad Request',
        message: 'Missing or invalid required fields: latitude, longitude, items',
      });
      return;
    }

    if (items.length === 0) {
      res.status(400).json({
        error: 'Bad Request',
        message: 'Items array cannot be empty',
      });
      return;
    }

    // Validate coordinates
    if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
      res.status(400).json({
        error: 'Bad Request',
        message: 'Invalid coordinates',
      });
      return;
    }

    console.log(`Comparing prices for ${items.length} items at location (${latitude}, ${longitude})`);

    // Step 1: Find nearby stores
    const stores = await storeDiscoveryService.findNearbyStores(latitude, longitude);
    console.log(`Found ${stores.length} nearby stores`);

    // Step 2: Get prices and aggregate results
    const storesWithPrices = await aggregationService.compareStores(stores, items);

    // Step 3: Log stats
    const stats = aggregationService.getStats(storesWithPrices);
    console.log('Comparison stats:', stats);

    // Step 4: Return results
    const response: CompareResponse = {
      stores: storesWithPrices,
      timestamp: new Date().toISOString(),
    };

    res.json(response);
  } catch (error) {
    console.error('Error in /compare endpoint:', error);

    res.status(500).json({
      error: 'Internal Server Error',
      message: error instanceof Error ? error.message : 'Unknown error occurred',
    });
  }
});

app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log(`Compare endpoint: POST http://localhost:${PORT}/compare`);
});
