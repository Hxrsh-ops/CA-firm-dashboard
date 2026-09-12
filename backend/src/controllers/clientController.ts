import { Request, Response, NextFunction } from 'express';
import { getUnitOfWork } from '../repositories/index.js';
import { ClientMatchingService } from '../services/clientMatchingService.js';

export class ClientController {
  static async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const uow = getUnitOfWork();
      const service = new ClientMatchingService(uow);
      const clients = await service.getAllClients(req.firm_id);
      res.json({ data: clients });
    } catch (err) {
      next(err);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const uow = getUnitOfWork();
      const service = new ClientMatchingService(uow);
      const client = await service.getClientById(req.firm_id, req.params.id);
      if (!client) {
        res.status(404).json({
          error: {
            code: 'CLIENT_NOT_FOUND',
            message: `Client with ID ${req.params.id} not found.`
          }
        });
        return;
      }
      res.json({ data: client });
    } catch (err) {
      next(err);
    }
  }
}
