import { UTApi } from "uploadthing/server";

const utapi = new UTApi();

interface DeleteFilesParams {
    fileKeys: string[];
}

export async function deleteFiles({ fileKeys }: DeleteFilesParams) {
    for (const key of fileKeys) {
        try {
            await utapi.deleteFiles(key, { keyType: "fileKey" });
        } catch (error) {
            console.error(`Error deleting file with key ${key}:`, error);
        }
    }
}
