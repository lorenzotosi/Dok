export type UserRole = 'USER' | 'ADMIN';

export interface User {
    id?: string;
    _id?: any;
    email: string;
    role: UserRole;
    firstName: string;
    lastName: string;
}