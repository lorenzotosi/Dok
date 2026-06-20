import * as Y from 'yjs';

export interface ActiveDocState {
  ydoc: Y.Doc;
  clientsCount: number;
  saveTimeout?: NodeJS.Timeout | null;

  hasLogObserver?: boolean;
  pendingUserChars?: Map<string, { inserted: number, deleted: number }>;
}

export const activeDocuments = new Map<string, ActiveDocState>();