import { createUploadthing, type FileRouter } from "uploadthing/next";
import { UploadThingError } from "uploadthing/server";

const f = createUploadthing();

async function auth() {
    await new Promise((resolve) => setTimeout(resolve, 100));
    return { id: "fakeId" };
}

export const ourFileRouter = {
    fileUploader: f({
        text: { maxFileSize: "4MB", maxFileCount: 8 },
        image: { maxFileSize: "4MB", maxFileCount: 8 },
        pdf: { maxFileSize: "4MB", maxFileCount: 8 },
        "application/vnd.ms-powerpoint": {
            maxFileSize: "4MB",
            maxFileCount: 8,
        },
    })
        .middleware(async () => {
            const user = await auth();

            if (!user) throw new UploadThingError("Unauthorized");

            return { userId: user.id };
        })
        .onUploadComplete(async ({ metadata }) => {
            return { uploadedBy: metadata.userId };
        }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
