import { google, sheets_v4 } from 'googleapis';
import { env } from '../config/env.js';

export class GoogleSheetsClient {
  private sheets: sheets_v4.Sheets | null = null;
  private spreadsheetId: string;

  constructor() {
    this.spreadsheetId = env.GOOGLE_SHEETS_SPREADSHEET_ID || '';
    if (env.GOOGLE_SERVICE_ACCOUNT_EMAIL && env.GOOGLE_PRIVATE_KEY) {
      try {
        const auth = new google.auth.JWT({
          email: env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
          key: env.GOOGLE_PRIVATE_KEY,
          scopes: ['https://www.googleapis.com/auth/spreadsheets']
        });
        this.sheets = google.sheets({ version: 'v4', auth });
      } catch (err) {
        console.warn('[GoogleSheetsClient] Failed to initialize Google Auth with provided credentials:', err);
      }
    }
  }

  isConfigured(): boolean {
    return !!(this.sheets && this.spreadsheetId);
  }

  getSpreadsheetId(): string {
    return this.spreadsheetId;
  }

  async getSheetValues(range: string): Promise<any[][]> {
    if (!this.sheets || !this.spreadsheetId) {
      throw new Error('Google Sheets client is not configured with valid credentials and spreadsheet ID.');
    }
    const response = await this.sheets.spreadsheets.values.get({
      spreadsheetId: this.spreadsheetId,
      range
    });
    return response.data.values || [];
  }

  async appendSheetRow(sheetName: string, rowValues: any[]): Promise<void> {
    if (!this.sheets || !this.spreadsheetId) {
      throw new Error('Google Sheets client is not configured with valid credentials and spreadsheet ID.');
    }
    await this.sheets.spreadsheets.values.append({
      spreadsheetId: this.spreadsheetId,
      range: `${sheetName}!A:Z`,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [rowValues]
      }
    });
  }

  async updateSheetRow(range: string, rowValues: any[]): Promise<void> {
    if (!this.sheets || !this.spreadsheetId) {
      throw new Error('Google Sheets client is not configured with valid credentials and spreadsheet ID.');
    }
    await this.sheets.spreadsheets.values.update({
      spreadsheetId: this.spreadsheetId,
      range,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [rowValues]
      }
    });
  }
}

export const googleSheetsClient = new GoogleSheetsClient();
