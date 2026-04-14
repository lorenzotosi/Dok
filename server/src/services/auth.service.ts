import jwt from 'jsonwebtoken';
import { UserModel, type IUser, UserRole } from '../models/User.js';

// Idealmente queste interfacce vanno in un file types dedicato
export interface AuthResponse {
    user: {
        id: string;
        email: string;
        role: UserRole;
        firstName: string;
        lastName: string;
    };
    token: string; // JWT Token
}

export class AuthService {
    private readonly JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key-change-in-production';
    private readonly JWT_EXPIRES_IN = '1d';

    private generateToken(user: IUser): string {
        return jwt.sign(
            { id: user._id, role: user.role }, // Payload: essenziale e piccolo
            this.JWT_SECRET,
            { expiresIn: this.JWT_EXPIRES_IN }
        );
    }

    async register(data: any): Promise<AuthResponse> {
        // Forza il ruolo a USER per evitare privilegi non autorizzati
        const user = new UserModel({
            ...data,
            passwordHash: data.password, // Il pre-save hook farà l'hashing
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

    async login(email: string, password: string): Promise<AuthResponse> {
        // Essendo select: false, dobbiamo richiederlo esplicitamente
        const user = await UserModel.findOne({ email }).select('+passwordHash');

        if (!user) {
            throw new Error('Credenziali non valide');
        }

        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            throw new Error('Credenziali non valide');
        }

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
}