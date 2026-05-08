export interface UserDetailDTO {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
    metrics: UserStats
    // Il Virtual File System conterrà solo metadati anonimizzati
    virtualFileSystem: {
        folders: any[];
        documents: any[];
    };
}

export interface UserStats {
    totalCreated: number;
    totalSharedByMe: number;
    totalSharedWithMe: number;
}

export interface SanitizedNode {
    id: string;
    type: 'FOLDER' | 'DOCUMENT';
    parentFolder: string | null;
    createdAt: Date;
}

export interface AuditLogItem {
    id: string;
    userId: string;
    action: 'LOGIN' | 'LOGOUT' | 'FAILED_LOGIN';
    timestamp: Date;
    ipAddress?: string;
}