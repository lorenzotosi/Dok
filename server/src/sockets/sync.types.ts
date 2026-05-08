import * as Y from 'yjs';

export interface ActiveDocState {
  ydoc: Y.Doc;
  clientsCount: number;
  saveTimeout?: NodeJS.Timeout | null;
}

export const activeDocuments = new Map<string, ActiveDocState>();