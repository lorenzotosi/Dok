import { api } from './api';
import type { User } from '../types/user.types';
import type {AdminUserDetail, AuditLogItem, VFSResponse} from "../types/admin.types.ts";

export interface AdminDashboardUser extends User {
    isOnline: boolean;
    lastSeen?: string;
    createdAt: string;
}

export const AdminService = {
    async getAllUsers(): Promise<AdminDashboardUser[]> {
        const response = await api.get<AdminDashboardUser[]>('/admin/users');
        return response.data;
    },

    async getUserDetail(userId: string): Promise<AdminUserDetail> {
        const response = await api.get<AdminUserDetail>(`/admin/users/${userId}`);
        return response.data;
    },

    async getUserFileSystem(userId: string): Promise<VFSResponse> {
        const response = await api.get<VFSResponse>(`/admin/users/${userId}/filesystem`);
        return response.data;
    },

    async changeUserRole(userId: string, newRole: 'USER' | 'ADMIN'): Promise<void> {
        await api.patch(`/admin/users/${userId}/role`, { role: newRole });
    },

    async getDocumentBasicInfo(documentId: string) {
        const response = await api.get(`/admin/documents/${documentId}`);
        return response.data;
    },

    async getDocumentLogs(documentId: string): Promise<AuditLogItem[]> {
        const response = await api.get(`/admin/documents/${documentId}/logs`);
        return response.data;
    },

    async getGlobalStats(range: string = '7d'): Promise<any> {
        const response = await api.get(`/admin/stats?range=${range}`);
        return response.data;
    }

};