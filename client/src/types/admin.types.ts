import type {User} from "./user.types.ts";

export interface AdminUserDetail extends User {
    isOnline: boolean;
    lastSeen?: string;
    docsCreated: number;
    docsSharedByMe: number;
    docsSharedWithMe: number;
}

export interface AuditLogItem {
    _id: string;
    documentId: string;
    userId: User;
    type: 'access' | 'modification';
    charactersInserted?: number;
    createdAt: string;
}

export interface SharedUserItem {
    userId: User
    role: 'editor' | 'viewer';
}

export interface FSNode {
    id: string;
    name: string;
    type: 'folder' | 'document';
    visibility: 'private' | 'public';
    ownerId?: string | User;
    children?: FSNode[];
    createdAt?: string;
    docsCount?: number;
    subfoldersCount?: number;
    sharedWithCount?: number;
    sharedWith?: SharedUserItem[];
}

export interface VFSResponse {
    privateTree: FSNode[];
    publicTree: FSNode[];
    sharedDocs: FSNode[];
}
