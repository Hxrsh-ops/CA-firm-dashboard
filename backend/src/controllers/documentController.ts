import { Request, Response, NextFunction } from 'express';
import { getUnitOfWork } from '../repositories/index.js';
import { DocumentService } from '../services/documentService.js';
import { documentReviewSchema } from '../schemas/validation.js';

export class DocumentController {
  static async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const uow = getUnitOfWork();
      const service = new DocumentService(uow);
      const documents = await service.getAllDocuments(req.firm_id);
      res.json({ data: documents });
    } catch (err) {
      next(err);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const uow = getUnitOfWork();
      const service = new DocumentService(uow);
      const document = await service.getDocumentById(req.firm_id, req.params.id);
      if (!document) {
        res.status(404).json({
          error: {
            code: 'DOCUMENT_NOT_FOUND',
            message: `Document with ID ${req.params.id} not found.`
          }
        });
        return;
      }
      res.json({ data: document });
    } catch (err) {
      next(err);
    }
  }

  static async review(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = documentReviewSchema.parse(req.body);
      const uow = getUnitOfWork();
      const service = new DocumentService(uow);
      
      const updated = await service.reviewDocument(req.firm_id, req.params.id, {
        action: parsed.action,
        document_type: parsed.document_type,
        period: parsed.period,
        notes: parsed.notes,
        reviewed_by: parsed.reviewed_by || req.user_identity || 'CA Partner'
      });

      if (!updated) {
        res.status(404).json({
          error: {
            code: 'DOCUMENT_NOT_FOUND',
            message: `Document with ID ${req.params.id} not found.`
          }
        });
        return;
      }

      res.json({ data: updated });
    } catch (err) {
      next(err);
    }
  }
}
