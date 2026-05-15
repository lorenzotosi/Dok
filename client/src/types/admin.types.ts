import type {User} from "./user.types.ts";

export interface AdminUserDetail extends User {
    isOnline: boolean;
    lastSeen?: string;
    docsCreated: number;
    docsSharedByMe: number;
    docsSharedWithMe: number;
}

export interface FSNode {
    id: string;
    name: string;
    type: 'folder' | 'document';
    visibility: 'private' | 'public';
    children?: FSNode[];
    createdAt?: string;
    docsCount?: number;
    subfoldersCount?: number;
    sharedWithCount?: number;
    sharedWith?: any;
}