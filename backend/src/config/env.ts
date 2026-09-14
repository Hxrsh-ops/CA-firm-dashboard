import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

export interface EnvConfig {
  PORT: number;
  NODE_ENV: 'development' | 'production' | 'test';
  API_PREFIX: string;
  CORS_ORIGIN: string;
  DEFAULT_FIRM_ID: string;
  WEBHOOK_SECRET: string;
  MAKE_REMINDER_WEBHOOK_URL: string;
  REPOSITORY_MODE: 'memory' | 'sheets';
  GOOGLE_SHEETS_SPREADSHEET_ID?: string;
  GOOGLE_SERVICE_ACCOUNT_EMAIL?: string;
  GOOGLE_PRIVATE_KEY?: string;
  GEMINI_API_KEY?: string;
}

export const env: EnvConfig = {
  PORT: parseInt(process.env.PORT || '3001', 10),
  NODE_ENV: (process.env.NODE_ENV as 'development' | 'production' | 'test') || 'development',
  API_PREFIX: process.env.API_PREFIX || '/api/v1',
  CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:5173',
  DEFAULT_FIRM_ID: process.env.DEFAULT_FIRM_ID || 'FIR-001',
  WEBHOOK_SECRET: process.env.WEBHOOK_SECRET || 'ca_copilot_webhook_secret_dev_key_12345',
  MAKE_REMINDER_WEBHOOK_URL: process.env.MAKE_REMINDER_WEBHOOK_URL || '',
  REPOSITORY_MODE: (process.env.REPOSITORY_MODE as 'memory' | 'sheets') || 'memory',
  GOOGLE_SHEETS_SPREADSHEET_ID: process.env.GOOGLE_SHEETS_SPREADSHEET_ID,
  GOOGLE_SERVICE_ACCOUNT_EMAIL: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
  GOOGLE_PRIVATE_KEY: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  GEMINI_API_KEY: process.env.GEMINI_API_KEY,
};

