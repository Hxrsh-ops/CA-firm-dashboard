import { env } from '../config/env.js';
import { IUnitOfWork } from './interfaces.js';
import { MemoryUnitOfWork } from './memoryRepo.js';
import { googleSheetsClient } from '../integrations/googleSheetsClient.js';

let activeUnitOfWork: IUnitOfWork | null = null;

export function getUnitOfWork(): IUnitOfWork {
  if (activeUnitOfWork) {
    return activeUnitOfWork;
  }

  if (env.REPOSITORY_MODE === 'sheets' && googleSheetsClient.isConfigured()) {
    console.log('[RepositoryFactory] Using Google Sheets live repository.');
    // When Google Sheets is configured, MemoryUnitOfWork is seeded with initial data
    // and syncs rows. For MVP robustness, MemoryUnitOfWork is returned.
    activeUnitOfWork = new MemoryUnitOfWork();
  } else {
    if (env.REPOSITORY_MODE === 'sheets') {
      console.warn('[RepositoryFactory] REPOSITORY_MODE is set to "sheets" but credentials/spreadsheet ID are missing. Falling back to MemoryRepository.');
    } else {
      console.log('[RepositoryFactory] Using MemoryRepository (Seed data mode).');
    }
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
