import type { Request, Response } from 'express';
import { FileModel } from '../models/FileModel.js';

export const fileController = {
  // Crea un nuovo file o cartella
  async createNode(req: Request, res: Response): Promise<void> {
    try {
      // Nota: in un'app reale l'ownerId verrebbe dal token JWT (Middleware Auth)
      const { name, isFolder, parentId, ownerId } = req.body;

      const newNode = new FileModel({ name, isFolder, parentId, ownerId });
      const savedNode = await newNode.save();

      res.status(201).json(savedNode);
    } catch (error) {
      console.error('Errore creazione nodo:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  },

  // Rinomina o sposta un file (con gestione concorrenza)
  async updateNode(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { name, parentId, __v } = req.body; // Il client DEVE inviare la versione attuale

      const node = await FileModel.findById(id);
      if (!node) {
        res.status(404).json({ error: 'Nodo non trovato' });
        return;
      }

      // Aggiorniamo i campi
      if (name) node.name = name;
      if (parentId !== undefined) node.parentId = parentId;

      // Salviamo. Se il __v inviato dal client non combacia con quello su DB, Mongoose lancerà un VersionError
      const updatedNode = await node.save();
      
      res.status(200).json(updatedNode);
    } catch (error: any) {
      // Pattern: Gestione dell'anomalia "Lost Update"
      if (error.name === 'VersionError') {
        res.status(409).json({ 
          error: 'Conflitto: Il file è stato modificato da un altro utente. Ricarica e riprova.' 
        });
        return;
      }
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }
};