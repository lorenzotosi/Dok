import Notification from "../models/Notification.js";

export class NotificationService {
    static async createNotification(recipient: string, sender: string, type: string, title: string, message: string, documentId?: string, link?: string) {
        const notification = new Notification({
            recipient,
            sender,
            type,
            title,
            message,
            documentId,
            link
        });
        return await notification.save();
    }

    static async getNotifications(userId: string) {
        return Notification.find({recipient: userId}).sort({createdAt: -1});
    }

    static async getUnreadNotifications(userId: string) {
        return Notification.find({recipient: userId, read: false}).sort({createdAt: -1});
    }

    static async markAsRead(id: string, userId: string) {
        return Notification.findOneAndUpdate(
            {_id: id, recipient: userId},
            {read: true},
            {new: true}
        );
    }

    static async markAllAsRead(userId: string) {
        return Notification.updateMany({ recipient: userId }, { read: true });
    }

    static async deleteNotification(id: string, userId: string) {
        return Notification.findOneAndDelete({ _id: id, recipient: userId });
    }
}