import jwt from 'jsonwebtoken';
import { UserModel, type IUser, UserRole } from '../models/User.js';
import SiteAccessLog from "../models/SiteAccessLog.js";

// Idealmente queste interfacce vanno in un file types dedicato
export interface AuthResponse {
    user: {
        id: string;
        email: string;
        role: UserRole;
        firstName: string;
        lastName: string;
    };
    token: string;
}

export class AuthService {
    private readonly JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key-change-in-production';
    private readonly JWT_EXPIRES_IN = '1d';

    private generateToken(user: IUser): string {
        if (!this.JWT_SECRET) {
            throw new Error("Configurazione server errata: JWT_SECRET mancante.");
        }
        const payload = {
            id: user._id.toString(),
            role: user.role
        };
        return jwt.sign(
            payload,
            this.JWT_SECRET,
            { expiresIn: this.JWT_EXPIRES_IN, algorithm: 'HS256' }
        );
    }

    async register(data: any): Promise<AuthResponse> {
        const user = new UserModel({
            ...data,
            passwordHash: data.password, // Il pre-save hook fa l'hashing
            role: UserRole.USER
        });

        await user.save();

        const token = this.generateToken(user);

        return {
            user: {
                id: user._id.toString(),
                email: user.email,
                role: user.role,
                firstName: user.firstName,
                lastName: user.lastName
            },
            token
        };
    }

    async login(email: string, password: string, ipAddress: string = 'unknown'): Promise<AuthResponse> {
        const user = await UserModel.findOne({ email }).select('+passwordHash');

        if (!user) {
            throw new Error('Credenziali non valide');
        }

        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            throw new Error('Credenziali non valide');
        }

        await UserModel.findByIdAndUpdate(user._id, { lastSeen: new Date() });
        const token = this.generateToken(user);

        try {
            await SiteAccessLog.create({
                userId: user._id,
                ipAddress: ipAddress
            });
        } catch (logError) {
            console.error("[AuthService] Errore salvataggio SiteAccessLog:", logError);
        }

        return {
            user: {
                id: user._id.toString(),
                email: user.email,
                role: user.role,
                firstName: user.firstName,
                lastName: user.lastName
            },
            token
        };
    }

    async logout(userId: string): Promise<void> {
        await UserModel.findByIdAndUpdate(userId, { lastSeen: new Date() });

        try {
            await SiteAccessLog.findOneAndUpdate(
                { userId: userId, logoutAt: null },
                { logoutAt: new Date() },
                { sort: { loginAt: -1 } }
            );
        } catch (logError) {
            console.error("[AuthService] Errore chiusura SiteAccessLog:", logError);
        }
    }
}