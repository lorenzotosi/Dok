import mongoose, {Schema, Document} from "mongoose";
import bcrypt from 'bcrypt';

export enum UserRole {
    USER = 'user',
    ADMIN = "admin"
 }

export interface IUser extends Document {
    email: string;
    passwordHash: string;
    role: UserRole;
    firstName: string;
    lastName: string;
    createdAt: Date;
    updatedAt: Date;
    comparePassword(candidatePassword: string): Promise<boolean>;
}

const userSchema = new Schema<IUser>(
    {
        email: { type: String, required: true, unique: true, lowercase: true, trim: true, maxLength: 254 },
        passwordHash: { type: String, required: true, select: false, maxLength: 72  }, // select: false evita che la password venga inviata di default nelle query
        role: { type: String, enum: Object.values(UserRole), default: UserRole.USER },
        firstName: { type: String, required: true, maxLength: 100 },
        lastName: { type: String, required: true, maxLength: 100 }
    },
    { timestamps: true }
)

// Hook pre-save per hashare la password se è stata modificata
userSchema.pre('save', async function () {
    if (!this.isModified('passwordHash')) {
        return;
    }

    const salt = await bcrypt.genSalt(12);
    this.passwordHash = await bcrypt.hash(this.passwordHash, salt);
});

// Metodo di istanza per verificare la password
userSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
    return bcrypt.compare(candidatePassword, this.passwordHash);
};

export const UserModel = mongoose.model<IUser>('User', userSchema);