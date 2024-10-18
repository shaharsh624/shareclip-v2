"use server";
import Clip from "@/models/clipModel";
import { revalidatePath } from "next/cache";
import { connectToMongoDB } from "./db";

export interface IFile {
    url: string;
    key: string;
    name: string;
}

export interface IFormData {
    name: string;
    validity: string;
    text?: string;
    files?: IFile[];
}

export const createClip = async (formData: IFormData) => {
    await connectToMongoDB();
    const name = formData["name"];
    const validity = Number(formData["validity"]);
    const text = formData["text"];
    const files = formData["files"];
    try {
        const newClip = await Clip.create({
            name,
            validity,
            text,
            files,
        });
        newClip.save();
        revalidatePath("/");
        return newClip.toString();
    } catch (error) {
        console.log(error);
        return { message: "error creating clip" };
    }
};

export const deleteClip = async (id: FormData) => {
    const clipName = id.get("name");
    try {
        await Clip.deleteOne({ name: clipName });
        revalidatePath("/");
        return "clip deleted";
    } catch {
        return { message: "error deleting clip" };
    }
};
