import Folder from '../models/Folder.js';
import Document from '../models/Document.js';
import {NotificationManager} from "../sockets/notificationManager.js";

export class FolderService {
  static async createFolder(name: string, ownerId: string, parentId: string | null = null, visibility: 'private' | 'public' = 'private') {
    const folder = new Folder({ name, ownerId, parentId, visibility });
    NotificationManager.notifyFileSystemUpdate(ownerId);
    return await folder.save();
  }

  static async getFoldersInsideParent(parentId: string | null = null, userId?: string) {
    const query: any = { parentId };
    if (userId) {
      query.$or = [{ ownerId: userId }, { visibility: 'public' }];
    } else {
      query.visibility = 'public';
    }

    return Folder.find(query)
      .populate('ownerId', 'firstName lastName')
      .sort({ createdAt: -1 });
  }

  static async getFolderById(id: string) {
    return Folder.findById(id);
  }

  static async getAllFolders(userId?: string) {
    const query: any = {};
    if (userId) {
      query.$or = [{ ownerId: userId }, { visibility: 'public' }];
    } else {
      query.visibility = 'public';
    }
    return Folder.find(query).sort({createdAt: -1});
  }

  static async deleteFolder(id: string) {
    const subfolders = await Folder.find({ parentId: id });

    for (const subfolder of subfolders) {
      await this.deleteFolder(subfolder._id.toString());
    }

    await Document.deleteMany({ folderId: id });

    return Folder.findByIdAndDelete(id);
  }
}