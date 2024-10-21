import cron from "node-cron";
import Clip from "@/models/clipModel";
import { connectToMongoDB } from "@/lib/db";
import { deleteFiles } from "@/hooks/use-delete-file";

const deleteExpiredClipsJob = async () => {
    await connectToMongoDB();

    try {
        const clipsFound = await Clip.find({
            expireAt: { $lte: new Date() },
        });
        const clipIds = clipsFound.map((clip) => clip._id);
        const clipFiles = clipsFound.flatMap((clip) => clip.files);
        const fileKeys = clipFiles
            .map((file) => file?.key)
            .filter((key): key is string => key !== undefined);

        const result = await Clip.deleteMany({ _id: { $in: clipIds } });
        await deleteFiles({ fileKeys });

        console.log(`Deleted ${result.deletedCount} expired clips.`);
    } catch (error) {
        console.error("Error deleting expired clips:", error);
    }
};

cron.schedule("* * * * *", deleteExpiredClipsJob, {
    timezone: "UTC",
});

export default deleteExpiredClipsJob;
