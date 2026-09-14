import { env } from '../config/env.js';
import { IUnitOfWork } from './interfaces.js';
import { MemoryUnitOfWork } from './memoryRepo.js';
import { GoogleSheetsUnitOfWork } from './googleSheetsRepo.js';
import { googleSheetsClient } from '../integrations/googleSheetsClient.js';

let activeUnitOfWork: IUnitOfWork | null = null;

export function getUnitOfWork(): IUnitOfWork {
  if (activeUnitOfWork) {
    return activeUnitOfWork;
  }

  if (env.REPOSITORY_MODE === 'sheets') {
    if (!googleSheetsClient.isConfigured()) {
      throw new Error(
        '[RepositoryFactory] REPOSITORY_MODE is set to "sheets" but Google Sheets credentials or spreadsheet ID are missing/invalid. Cannot start in sheets mode.'
      );
    }
    console.log('[RepositoryFactory] Using Google Sheets live repository.');
    activeUnitOfWork = new GoogleSheetsUnitOfWork(googleSheetsClient);
  } else {
    console.log('[RepositoryFactory] Using MemoryRepository (Seed data mode).');
    activeUnitOfWork = new MemoryUnitOfWork();
  }

  return activeUnitOfWork;
}

export function resetUnitOfWorkForTesting(uow?: IUnitOfWork): IUnitOfWork {
  activeUnitOfWork = uow || new MemoryUnitOfWork();
  return activeUnitOfWork;
}

export * from './interfaces.js';
export * from './memoryRepo.js';
export * from './googleSheetsRepo.js';

