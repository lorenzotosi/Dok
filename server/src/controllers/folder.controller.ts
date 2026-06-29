import { type Response } from 'express';
import { FolderService } from '../services/folder.service.js';
import { type AuthRequest } from '../middlewares/auth.middleware.js';
import folder from "../models/Folder.js";

export const createFolder = async (req: AuthRequest, res: Response) => {
    try {
        const { name, parentId, visibility } = req.body;
        const ownerId = req.user!.id;
        const io = req.app.get('io');
        const folder = await FolderService.createFolder(name, ownerId, parentId, visibility);
        if (folder.visibility === 'public') {
            io.to('global-dashboard').emit('global-folder-created', folder);
        }
        res.status(201).json(folder);
    } catch (error) {
        console.error("Errore creazione cartella:", error);
        res.status(500).json({ error: 'Errore interno del server' });
    }
};

export const getFoldersInsideParent = async (req: AuthRequest, res: Response) => {
    try {
        const parentId = (req.query.parentId as string) || null;
        const userId = req.user?.id;
        const folders = await FolderService.getFoldersInsideParent(parentId, userId);
        res.json(folders);
    } catch (error) {
        console.error("Errore recupero cartelle:", error);
        res.status(500).json({ error: 'Errore interno del server' });
    }
};

export const getAllFolders = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.id;
        const folders = await FolderService.getAllFolders(userId);
        res.json(folders);
    } catch (error) {
        console.error("Errore recupero cartelle:", error);
        res.status(500).json({ error: 'Errore interno del server' });
    }
};

export const deleteFolder = async (req: AuthRequest, res: Response) => {
    try {
        const folderId = req.params._id as string;
        const userId = req.user!.id;
        const role = req.user?.role

        const folderToDelete = await FolderService.getFolderById(folderId);

        if (!folderToDelete) {
            res.status(404).json({ error: 'Cartella non trovata' });
            return;
        }

        if (folderToDelete.visibility === 'private') {
            if (folderToDelete.ownerId.toString() !== userId) {
                res.status(403).json({ error: 'Non hai i permessi per eliminare questa cartella' });
                return;
            }
        } else {
            if (folderToDelete.ownerId.toString() !== userId && role !== 'ADMIN') {
                res.status(403).json({ error: 'Non hai i permessi per eliminare questa cartella' });
                return;
            }
        }

        await FolderService.deleteFolder(folderId);
        const io = req.app.get('io');
        if (io) {
            if (folderToDelete.visibility === 'public') {
                io.to('global-dashboard').emit('global-folder-deleted', folderId);
            }
        }
        res.json(folderId);
    } catch (error) {
        console.error("Errore eliminazione cartella:", error);
        res.status(500).json({ error: 'Errore interno del server' });
    }
};