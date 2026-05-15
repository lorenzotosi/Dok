import { UserModel } from '../models/User.js';
import DocumentModel from '../models/Document.js';
import FolderModel from '../models/Folder.js';

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

    static async changeUserRole(userId: string, newRole: 'USER' | 'ADMIN') {
        const updatedUser = await UserModel.findByIdAndUpdate(
            userId,
            { role: newRole },
            {
                returnDocument: 'after',
                select: '-passwordHash'
            }
        ).lean();

        if (!updatedUser) {
            throw new Error('Utente non trovato');
        }

        return updatedUser;
    }

    static async getUserFileSystem(userId: string) {
        const [folders, docs] = await Promise.all([
            FolderModel.find({ ownerId: userId }).lean(),
            DocumentModel.find({ ownerId: userId })
                .populate('sharedWith.userId', 'firstName lastName email')
                .lean()
        ]);

        const sharedDocs = await DocumentModel.find({ 'sharedWith.userId': userId })
            .populate('ownerId', 'firstName lastName email')
            .lean();

        const buildTree = (parentId: string | null = null, prefix: string = ''): any[] => {
            const tree: any[] = [];

            const currentFolders = folders.filter(f =>
                parentId === null ? f.parentId === null : f.parentId?.toString() === parentId
            );

            currentFolders.forEach((folder, index) => {
                const char = String.fromCharCode(65 + index);
                const label = prefix ? `${prefix}.${char}` : char;

                tree.push({
                    id: folder._id.toString(),
                    name: `Cartella ${label}`,
                    type: 'folder',
                    visibility: folder.visibility,
                    createdAt: (folder as any).createdAt,
                    children: buildTree(folder._id.toString(), label),
                    subfoldersCount: folders.filter(f => f.parentId?.toString() === folder._id.toString()).length,
                    docsCount: docs.filter(d => d.folderId?.toString() === folder._id.toString()).length
                });
            });

            const currentDocs = docs.filter(d =>
                parentId === null ? d.folderId === null : d.folderId?.toString() === parentId
            );

            currentDocs.forEach((doc, index) => {
                const label = prefix ? `${prefix}.${index + 1}` : `${index + 1}`;

                tree.push({
                    id: doc._id.toString(),
                    name: `Documento ${label}`,
                    type: 'document',
                    visibility: doc.visibility,
                    createdAt: (doc as any).createdAt,
                    sharedWith: doc.sharedWith,
                    sharedWithCount: doc.sharedWith?.length || 0
                });
            });

            return tree;
        };

        const userFileSystem = buildTree();

        if (sharedDocs.length > 0) {
            userFileSystem.push({
                id: 'virtual-shared-folder',
                name: 'Condivisi con questo utente',
                type: 'folder',
                visibility: 'private',
                docsCount: sharedDocs.length,
                subfoldersCount: 0,
                children: sharedDocs.map((doc, index) => ({
                    id: doc._id.toString(),
                    name: `Doc_Ricevuto_${index + 1}`,
                    type: 'document',
                    visibility: doc.visibility,
                    createdAt: (doc as any).createdAt,
                    sharedWithCount: doc.sharedWith?.length || 0,
                    ownerId: doc.ownerId
                }))
            });
        }

        return userFileSystem;
    }
}