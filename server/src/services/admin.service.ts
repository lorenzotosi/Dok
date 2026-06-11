import {UserModel} from '../models/User.js';
import DocumentModel from '../models/Document.js';
import FolderModel from '../models/Folder.js';
import AuditLog from "../models/AuditLog.js";
import SiteAccessLog from "../models/SiteAccessLog.js";

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

    /**
     * Recupera tutti i log di accesso al sito, popolando i dati dell'utente.
     */
    static async getGlobalAccessLogs() {
        return SiteAccessLog.find()
            .populate('userId', 'firstName lastName email _id')
            .sort({ loginAt: -1 })
            .lean();
    }

    /**
     * Recupera i log di accesso al sito per un singolo utente.
     */
    static async getUserAccessLogs(userId: string) {
        return SiteAccessLog.find({ userId })
            .sort({ loginAt: -1 })
            .lean();
    }


    /**
     * Helpers per getGlobalStats
     */
    private static async getStatsUsers() {
        const [total, admins] = await Promise.all([
            UserModel.countDocuments(),
            UserModel.countDocuments({ role: 'ADMIN' })
        ]);
        return { total, admins, normals: total - admins };
    }

    private static async getStatsDocuments() {
        const [total, publicDocs] = await Promise.all([
            DocumentModel.countDocuments(),
            DocumentModel.countDocuments({ visibility: 'public' })
        ]);
        return { total, public: publicDocs, private: total - publicDocs };
    }

    private static async getStatsFolders() {
        const [total, publicFolders] = await Promise.all([
            FolderModel.countDocuments(),
            FolderModel.countDocuments({ visibility: 'public' })
        ]);
        return { total, public: publicFolders, private: total - publicFolders };
    }

    private static async getStatsShares() {
        const [total, readOnly, edit] = await Promise.all([
            DocumentModel.countDocuments({ "sharedWith.0": { $exists: true } }),
            DocumentModel.countDocuments({ "sharedWith.role": "viewer" }),
            DocumentModel.countDocuments({ "sharedWith.role": "editor" })
        ]);
        return { total, readOnly, edit };
    }

    private static async getStatsAccessChart(range: string) {
        // aggregati
        if (range.startsWith('trend-')) {
            let groupId: any = {};

            if (range === 'trend-hour') {
                groupId = { $hour: "$loginAt" };
            } else if (range === 'trend-weekday') {
                groupId = { $isoDayOfWeek: "$loginAt" };
            } else if (range === 'trend-monthday') {
                groupId = { $dayOfMonth: "$loginAt" };
            }

            const data = await SiteAccessLog.aggregate([
                { $group: { _id: groupId, count: { $sum: 1 } } },
                { $sort: { "_id": 1 } }
            ]);

            const map = new Map(data.map(d => [d._id, d.count]));
            const categories: string[] = [];
            const series: number[] = [];

            if (range === 'trend-hour') {
                for (let i = 0; i < 24; i++) {
                    categories.push(`${i.toString().padStart(2, '0')}:00`);
                    series.push(map.get(i) || 0);
                }
            } else if (range === 'trend-weekday') {
                const days = ['Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato', 'Domenica'];
                days.forEach((day, index) => {
                    categories.push(day);
                   series.push(map.get(index + 1) || 0);
                });
            } else if (range === 'trend-monthday') {
                for (let i = 1; i <= 31; i++) {
                    categories.push(i.toString());
                    series.push(map.get(i) || 0);
                }
            }

            return { categories, series };
        }

        // storico
        let startDate;
        let endDate = new Date();
        let groupFormat = "%Y-%m-%d";
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

        if (range === '24h') {
            startDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
            groupFormat = "%Y-%m-%dT%H:00:00.000Z";
        } else if (dateRegex.test(range)) {
            startDate = new Date(range);
            startDate.setHours(0, 0, 0, 0);
            endDate = new Date(range);
            endDate.setHours(23, 59, 59, 999);
            groupFormat = "%Y-%m-%dT%H:00:00.000Z";
        } else if (range === '30d') {
            startDate = new Date(Date.now() - 29 * 24 * 60 * 60 * 1000);
            startDate.setHours(0, 0, 0, 0);
        } else {
            startDate = new Date(Date.now() - 6 * 24 * 60 * 60 * 1000);
            startDate.setHours(0, 0, 0, 0);
        }

        const matchFilter: any = { loginAt: { $gte: startDate } };
        if (dateRegex.test(range)) {
            matchFilter.loginAt.$lte = endDate;
        }

        const data = await SiteAccessLog.aggregate([
            { $match: matchFilter },
            { $group: { _id: { $dateToString: { format: groupFormat, date: "$loginAt" } }, count: { $sum: 1 } } },
            { $sort: { "_id": 1 } }
        ]);

        return {
            categories: data.map(log => log._id),
            series: data.map(log => log.count)
        };
    }
    /**
     * Recupera le statistiche globali della piattaforma con i dettagli per le sottocategorie.
     */
    static async getGlobalStats(range: string = '7d') {
        const [users, documents, folders, shares, accessChart] = await Promise.all([
            this.getStatsUsers(),
            this.getStatsDocuments(),
            this.getStatsFolders(),
            this.getStatsShares(),
            this.getStatsAccessChart(range)
        ]);

        return {
            users,
            documents,
            folders,
            shares,
            accessChart
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