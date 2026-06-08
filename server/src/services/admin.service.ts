import {UserModel} from '../models/User.js';
import DocumentModel from '../models/Document.js';
import FolderModel from '../models/Folder.js';
import AuditLog from "../models/AuditLog.js";

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

    /**
     * Recupera le info del documento mascherando i dati sensibili per l'Admin.
     */
    static async getDocumentInfoForAdmin(documentId: string) {
        const doc = await DocumentModel.findById(documentId)
            .select('-tiptapJson -yjsState')
            .populate('ownerId', 'firstName lastName email')
            .lean();

        if (!doc) {
            throw new Error('Documento non trovato');
        }

        return {
            ...doc,
            title: doc.visibility === 'public' ? doc.title : 'Documento Riservato',
            originalId: doc._id
        };
    }

    /**
     * Recupera l'Audit Log completo di un documento, popolando gli utenti.
     */
    static async getDocumentLogs(documentId: string) {
        return AuditLog.find({ documentId: documentId })
            .populate('userId', 'firstName lastName email _id')
            .sort({ createdAt: -1 })
            .lean();
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
        const privateFolders = await FolderModel.find({ ownerId: userId, visibility: 'private' }).lean();
        const privateDocs = await DocumentModel.find({ ownerId: userId, visibility: 'private' })
            .populate('sharedWith.userId', 'firstName lastName email').lean();

        const sharedDocs = await DocumentModel.find({ 'sharedWith.userId': userId })
            .populate('ownerId', 'firstName lastName email')
            .populate('sharedWith.userId', 'firstName lastName email').lean();

        const publicFoldersOwned = await FolderModel.find({ ownerId: userId, visibility: 'public' }).populate('ownerId', 'firstName lastName email').lean();
        const publicDocsOwned = await DocumentModel.find({ ownerId: userId, visibility: 'public' })
            .populate('ownerId', 'firstName lastName email')
            .populate('sharedWith.userId', 'firstName lastName email').lean();

        const allPublicFoldersMap = new Map<string, any>();
        publicFoldersOwned.forEach(f => allPublicFoldersMap.set(f._id.toString(), f));

        let parentIdsToFetch = new Set<string>();
        publicFoldersOwned.forEach(f => f.parentId && parentIdsToFetch.add(f.parentId.toString()));
        publicDocsOwned.forEach(d => d.folderId && parentIdsToFetch.add(d.folderId.toString()));

        while (parentIdsToFetch.size > 0) {
            const missingParents = await FolderModel.find({ _id: { $in: Array.from(parentIdsToFetch) } })
                .populate('ownerId', 'firstName lastName email').lean();

            parentIdsToFetch.clear();
            missingParents.forEach(p => {
                if (!allPublicFoldersMap.has(p._id.toString())) {
                    allPublicFoldersMap.set(p._id.toString(), p);
                    if (p.parentId) parentIdsToFetch.add(p.parentId.toString());
                }
            });
        }

        const buildPrivateTree = (parentId: string | null = null, prefix: string = ''): any[] => {
            const tree: any[] = [];
            const currFolders = privateFolders.filter(f => parentId === null ? f.parentId === null : f.parentId?.toString() === parentId);

            currFolders.forEach((f: any, idx) => { //f:any altrimenti, anche se Folder ha timestamps:true, non vede createdAt
                const char = String.fromCharCode(65 + idx);
                const label = prefix ? `${prefix}.${char}` : char;
                tree.push({
                    id: f._id.toString(),
                    name: `Cartella ${label}`,
                    type: 'folder',
                    visibility: 'private',
                    createdAt: f.createdAt,
                    ownerId: userId,
                    children: buildPrivateTree(f._id.toString(), label),
                    subfoldersCount: privateFolders.filter(sf => sf.parentId?.toString() === f._id.toString()).length,
                    docsCount: privateDocs.filter(sd => sd.folderId?.toString() === f._id.toString()).length
                });
            });

            const currDocs = privateDocs.filter(d => parentId === null ? d.folderId === null : d.folderId?.toString() === parentId);
            currDocs.forEach((d, idx) => {
                const label = prefix ? `${prefix}.${idx + 1}` : `${idx + 1}`;
                tree.push({
                    id: d._id.toString(), name: `Dok ${label}`, type: 'document', visibility: 'private',
                    createdAt: (d as any).createdAt, ownerId: userId, sharedWith: d.sharedWith, sharedWithCount: d.sharedWith?.length || 0
                });
            });
            return tree;
        };

        const allPublicFoldersArray = Array.from(allPublicFoldersMap.values());
        const buildPublicTree = (parentId: string | null = null): any[] => {
            const tree: any[] = [];
            const currFolders = allPublicFoldersArray.filter(f => parentId === null ? f.parentId === null : f.parentId?.toString() === parentId);

            currFolders.forEach(f => {
                const children = buildPublicTree(f._id.toString());
                if (f.ownerId._id.toString() === userId || children.length > 0) {
                    tree.push({
                        id: f._id.toString(),
                        name: f.name,
                        type: 'folder',
                        visibility: 'public',
                        createdAt: f.createdAt,
                        ownerId: f.ownerId,
                        children,
                        subfoldersCount: allPublicFoldersArray.filter(sf => sf.parentId?.toString() === f._id.toString()).length,
                        docsCount: publicDocsOwned.filter(sd => sd.folderId?.toString() === f._id.toString()).length
                    });
                }
            });

            const currDocs = publicDocsOwned.filter(d => parentId === null ? d.folderId === null : d.folderId?.toString() === parentId);
            currDocs.forEach(d => {
                tree.push({
                    id: d._id.toString(), name: d.title, type: 'document', visibility: 'public',
                    createdAt: (d as any).createdAt, ownerId: d.ownerId, sharedWith: d.sharedWith, sharedWithCount: d.sharedWith?.length || 0
                });
            });
            return tree;
        };

        return {
            privateTree: buildPrivateTree(),
            publicTree: buildPublicTree(),
            sharedDocs: sharedDocs.map((d, index) => ({
                id: d._id.toString(),
                name: `Dok Condiviso ${index + 1}`,
                type: 'document',
                visibility: d.visibility,
                createdAt: (d as any).createdAt,
                ownerId: d.ownerId,
                sharedWith: d.sharedWith,
                sharedWithCount: d.sharedWith?.length || 0
            }))
        };
    }
}