import cron from 'node-cron'
import Clip from '@/models/clipModel';
import { connectToMongoDB } from "@/lib/db";

const deleteExpiredClipsJob = async () => {
  await connectToMongoDB();

  try {
    const result = await Clip.deleteMany({ expireAt: { $lte: new Date() } });
    console.log(`Deleted ${result.deletedCount} expired clips.`);
  } catch (error) {
    console.error('Error deleting expired clips:', error);
  }
};

cron.schedule('* * * * *', deleteExpiredClipsJob, {
  timezone: 'UTC',
});

console.log('Scheduled cron job to delete expired clips.');

export default deleteExpiredClipsJob;
