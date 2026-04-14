import { type Request, type Response } from 'express';
import { FolderService } from '../services/folder.service.js';
import { log } from 'node:console';

export const createFolder = async (req: Request, res: Response) => {
    try {
        const { name, parentId } = req.body;
        const folder = await FolderService.createFolder(name, parentId);
        res.status(201).json(folder);
    } catch (error) {
        console.error("Errore creazione cartella:", error);
        res.status(500).json({ error: 'Errore interno del server' });
    }
};

export const getFoldersInsideParent = async (req: Request, res: Response) => {
    try {
        const parentId = (req.query.parentId as string) || null;
        const folders = await FolderService.getFoldersInsideParent(parentId);
        res.json(folders);
    } catch (error) {
        console.error("Errore recupero cartelle:", error);
        res.status(500).json({ error: 'Errore interno del server' });
    }
};

export const getAllFolders = async (req: Request, res: Response) => {
    try {
        const folders = await FolderService.getAllFolders();
        res.json(folders);
    } catch (error) {
        console.error("Errore recupero cartelle:", error);
        res.status(500).json({ error: 'Errore interno del server' });
    }
};

export const deleteFolder = async (req: Request, res: Response) => {
    try {
        const folderId = req.params._id as string;
        log("folderId da eliminare:", folderId);
        const folder = await FolderService.deleteFolder(folderId);
        log("folder eliminato:", folder);
        res.json(folderId);
    } catch (error) {
        console.error("Errore eliminazione cartella:", error);
        res.status(500).json({ error: 'Errore interno del server' });
    }
};