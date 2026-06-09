import mongoose, { Document, Schema } from 'mongoose';

export interface ISiteAccessLog extends Document {
    userId: mongoose.Types.ObjectId;
    loginAt: Date;
    logoutAt?: Date | null;
    ipAddress?: string;
}

const siteAccessLogSchema = new Schema<ISiteAccessLog>({
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    loginAt: { type: Date, default: Date.now },
    logoutAt: { type: Date, default: null },
    ipAddress: { type: String, default: 'unknown' }
});

siteAccessLogSchema.index({ loginAt: -1 });

export default mongoose.model<ISiteAccessLog>('SiteAccessLog', siteAccessLogSchema);