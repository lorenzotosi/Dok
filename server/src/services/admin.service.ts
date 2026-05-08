import { UserModel } from '../models/User.js';
import DocumentModel from '../models/Document.js';

export class AdminService {
    /**
     * Recupera gli utenti dal database applicando la proiezione
     * per escludere dati sensibili come la password.
     */
    static async getAllUsersBasicInfo() {
        return UserModel.find({}, {
            firstName: 1,
            lastName: 1,
            email: 1,
            role: 1,
            lastSeen: 1,
            createdAt: 1
        }).lean();
    }

    /**
     * Recupera le metriche di un singolo utente con query parallele.
     * Pattern: Fan-out / Parallel Data Fetching
     */
    static async getUserMetrics(userId: string) {
        const [user, docsCreated, docsSharedByMe, docsSharedWithMe] = await Promise.all([
            UserModel.findById(userId).select('-passwordHash').lean(),
            DocumentModel.countDocuments({ ownerId: userId }),
            DocumentModel.countDocuments({
                ownerId: userId,
                'sharedWith.0': { $exists: true }
            }),
            DocumentModel.countDocuments({
                'sharedWith.userId': userId
            })
        ]);

        if (!user) {
            throw new Error('Utente non trovato');
        }

        return {
            user,
            metrics: {
                docsCreated,
                docsSharedByMe,
                docsSharedWithMe
            }
        };
    }
}