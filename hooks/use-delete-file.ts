import { UTApi } from "uploadthing/server";

const utapi = new UTApi();

interface DeleteFilesParams {
    fileKeys: string[];
}

export async function deleteFiles({ fileKeys }: DeleteFilesParams) {
    for (const key of fileKeys) {
        try {
            await utapi.deleteFiles(key, { keyType: "fileKey" });
            console.log(`Successfully deleted file with key: ${key}`);
        } catch (error) {
            console.error(`Error deleting file with key ${key}:`, error);
        }
    }
}
