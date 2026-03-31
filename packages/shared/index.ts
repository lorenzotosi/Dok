export interface IFileNode {
    _id: string;
    name: string;
    isFolder: boolean;
    parentId: string | null;
    ownerId: string;
    __v: number;
    createdAt: Date;
    updatedAt: Date;
}

export interface IDocumentContent {
    fileId: string;
    binaryState: Uint8Array;
    jsonState: Record<string, any>;
}

export interface ServerToClientEvents {
    documentUpdate: (update: Uint8Array) => void;
    awarenessUpdate: (update: Uint8Array) => void;
}

export interface ClientToServerEvents {
    joinDocument: (documentId: string) => void;
    sendDocumentUpdate: (documentId: string, update: Uint8Array) => void;
    sendAwarenessUpdate: (documentId: string, update: Uint8Array) => void;
}