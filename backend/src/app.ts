import express from 'express';
import cors from 'cors';
import { env } from './config/env.js';
import apiV1Router from './routes/apiV1.js';
import { errorHandler } from './middleware/errorHandler.js';

export const app = express();

// Security & Parsing Middlewares
app.use(cors({
  origin: env.CORS_ORIGIN,
  credentials: true
}));
app.use(express.json());

// Health Check Endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    system: 'CA Copilot API v1',
    mode: env.REPOSITORY_MODE,
    timestamp: new Date().toISOString()
  });
});

// Mount API v1
app.use(env.API_PREFIX, apiV1Router);

// Global Error Handler
app.use(errorHandler);
