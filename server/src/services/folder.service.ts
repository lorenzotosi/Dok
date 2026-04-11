import Folder from '../models/Folder.js';

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
    return await Folder.findByIdAndDelete(id);
  }
}