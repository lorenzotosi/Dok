export type UserRole = 'USER' | 'ADMIN';

export interface User {
    id?: string;
    _id?: any; //boh, che due balle, è per rimuovere warning di IntelliJ
    email: string;
    role: UserRole;
    firstName: string;
    lastName: string;
}