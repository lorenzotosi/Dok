import Folder from '../models/Folder.js';
import Document from '../models/Document.js';

export class FolderService {
  static async createFolder(name: string, parentId: string | null = null) {
    const folder = new Folder({ name, parentId });
    return await folder.save();
  }

  static async getFoldersInsideParent(parentId: string | null = null) {
    return await Folder.find({ parentId }).sort({ createdAt: -1 });
  }

  static async getAllFolders() {
    return await Folder.find().sort({ createdAt: -1 });
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