// ========================================================
// CA COPILOT — FRONTEND API CLIENT
// Connects to /api/v1 backend endpoints
// ========================================================

export type DataConnectionStatus = 'live' | 'demo' | 'unavailable';

const API_BASE = '/api/v1';

class ApiClient {
  private firmId: string = 'FIR-001';
  private connectionStatus: DataConnectionStatus = 'live';

  setFirmId(id: string) {
    this.firmId = id;
  }

  getFirmId(): string {
    return this.firmId;
  }

  getConnectionStatus(): DataConnectionStatus {
    return this.connectionStatus;
  }

  setConnectionStatus(status: DataConnectionStatus) {
    this.connectionStatus = status;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'x-firm-id': this.firmId,
      ...((options.headers as Record<string, string>) || {})
    };

    try {
      const response = await fetch(`${API_BASE}${endpoint}`, {
        ...options,
        headers
      });

      if (!response.ok) {
        let errorData: any = {};
        try {
          errorData = await response.json();
        } catch {
          errorData = { error: { message: `HTTP ${response.status} ${response.statusText}` } };
        }
        throw new Error(errorData.error?.message || `Request failed with status ${response.status}`);
      }

      const json = await response.json();
      this.connectionStatus = 'live';
      return json.data !== undefined ? json.data : json;
    } catch (err: any) {
      // If network fails (e.g. backend offline in dev mode), record unavailable
      if (err.message.includes('Failed to fetch') || err.message.includes('NetworkError')) {
        this.connectionStatus = 'unavailable';
      }
      throw err;
    }
  }

  // Health
  async checkHealth(): Promise<{ status: string; mode: string }> {
    const res = await fetch('/health');
    return res.json();
  }

  // Dashboard
  async getDashboard(period = '2026-08') {
    return this.request<any>(`/dashboard?period=${encodeURIComponent(period)}`);
  }

  // AI Intake Inbox
  async getInbox(tab = 'all', search?: string) {
    const query = new URLSearchParams({ tab });
    if (search) query.append('search', search);
    return this.request<any>(`/inbox?${query.toString()}`);
  }

  // Clients
  async getClients() {
    return this.request<any[]>('/clients');
  }

  async getClientById(id: string) {
    return this.request<any>(`/clients/${encodeURIComponent(id)}`);
  }

  // Documents
  async getDocuments() {
    return this.request<any[]>('/documents');
  }

  async getDocumentById(id: string) {
    return this.request<any>(`/documents/${encodeURIComponent(id)}`);
  }

  async reviewDocument(id: string, payload: { action: 'approve' | 'reject' | 'reclassify'; notes?: string; document_type?: string; period?: string }) {
    return this.request<any>(`/documents/${encodeURIComponent(id)}/review`, {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }

  // Alerts
  async getAlerts() {
    return this.request<any[]>('/alerts');
  }

  async updateAlert(id: string, payload: { status: string; notes?: string }) {
    return this.request<any>(`/alerts/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify(payload)
    });
  }

  // Reminders
  async getReminders() {
    return this.request<any[]>('/reminders');
  }

  async createReminder(payload: { client_id: string; document_type: string; period: string; recipient_email: string; subject: string; body: string }) {
    return this.request<any>('/reminders', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }

  async approveReminder(id: string, approvedBy = 'CA Partner') {
    return this.request<any>(`/reminders/${encodeURIComponent(id)}/approve`, {
      method: 'POST',
      body: JSON.stringify({ approved_by: approvedBy })
    });
  }

  async sendReminder(id: string) {
    return this.request<any>(`/reminders/${encodeURIComponent(id)}/send`, {
      method: 'POST'
    });
  }

  async cancelReminder(id: string, reason?: string) {
    return this.request<any>(`/reminders/${encodeURIComponent(id)}/cancel`, {
      method: 'POST',
      body: JSON.stringify({ reason })
    });
  }

  // Compliance
  async getCompliance(period = '2026-08') {
    return this.request<any>(`/compliance?period=${encodeURIComponent(period)}`);
  }

  // Audit Log
  async getAuditLog() {
    return this.request<any[]>('/audit-log');
  }

  // Settings
  async getSettings() {
    return this.request<any[]>('/settings');
  }
}

export const apiClient = new ApiClient();
