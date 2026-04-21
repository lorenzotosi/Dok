import Folder from '../models/Folder.js';
import Document from '../models/Document.js';

export class FolderService {
  static async createFolder(name: string, ownerId: string, parentId: string | null = null, visibility: 'private' | 'public' = 'private') {
    const folder = new Folder({ name, ownerId, parentId, visibility });
    return await folder.save();
  }

  static async getFoldersInsideParent(parentId: string | null = null, userId?: string) {
    const query: any = { parentId };
    if (userId) {
      query.$or = [{ ownerId: userId }, { visibility: 'public' }];
    } else {
      query.visibility = 'public';
    }

    return await Folder.find(query)
      .populate('ownerId', 'firstName lastName')
      .sort({ createdAt: -1 });
  }

  static async getFolderById(id: string) {
    return await Folder.findById(id);
  }

  static async getAllFolders(userId?: string) {
    const query: any = {};
    if (userId) {
      query.$or = [{ ownerId: userId }, { visibility: 'public' }];
    } else {
      query.visibility = 'public';
    }
    return await Folder.find(query).sort({ createdAt: -1 });
  }

  static async deleteFolder(id: string) {
    // 1. Trova tutte le sottocartelle
    const subfolders = await Folder.find({ parentId: id });
    
    // 2. Elimina ricorsivamente ogni sottocartella
    for (const subfolder of subfolders) {
      await this.deleteFolder(subfolder._id.toString());
    }

    // 3. Elimina tutti i documenti contenuti in questa cartella
    await Document.deleteMany({ folderId: id });

    // 4. Infine, elimina la cartella stessa
    return await Folder.findByIdAndDelete(id);
  }
}