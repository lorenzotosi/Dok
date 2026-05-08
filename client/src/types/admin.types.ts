import type {User} from "./user.types.ts";

export interface AdminUserDetail extends User {
    isOnline: boolean;
    lastSeen?: string;
    docsCreated: number;
    docsSharedByMe: number;
    docsSharedWithMe: number;
}
