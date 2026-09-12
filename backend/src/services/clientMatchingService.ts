import { IUnitOfWork } from '../repositories/interfaces.js';
import { Client } from '../types/domain.js';

export class ClientMatchingService {
  constructor(private uow: IUnitOfWork) {}

  /**
   * Deterministically match an incoming sender email to a registered client.
   * Gemini extraction is informational only and MUST NOT be used for authoritative identity.
   */
  async matchClientByEmail(firm_id: string, senderEmail: string): Promise<Client | null> {
    if (!senderEmail || !senderEmail.trim()) {
      return null;
    }
    const cleanEmail = senderEmail.trim().toLowerCase();
    const client = await this.uow.clients.findByEmail(firm_id, cleanEmail);
    return client;
  }

  async getClientById(firm_id: string, clientId: string): Promise<Client | null> {
    return this.uow.clients.findById(firm_id, clientId);
  }

  async getAllClients(firm_id: string): Promise<Client[]> {
    return this.uow.clients.findAll(firm_id);
  }
}
