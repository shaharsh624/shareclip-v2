"use server";
import Clip, { IClipDocument } from "@/models/clipModel";
import { revalidatePath } from "next/cache";
import { connectToMongoDB } from "./db";
import { DateTime } from "luxon";

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

export interface IClipError {
    message: string;
}

export type GetClipResponse = IClipDocument | IClipError | null;

export const createClip = async (formData: IFormData) => {
    await connectToMongoDB();
    const name = formData["name"];
    const validity = Number(formData["validity"]);
    const text = formData["text"];
    const files = formData["files"];
    const expireAt = new Date(Date.now() + validity * 1000);
    try {
        const newClip = await Clip.create({
            name,
            validity,
            text,
            files,
            expireAt,
        });
        newClip.save();
        revalidatePath("/");
        return newClip.toString();
    } catch (error) {
        console.log(error);
        return { message: "error creating clip" };
    }
};

export const getClip = async (clipName: string) => {
    try {
        const foundClip = await Clip.findOne({ name: clipName }).lean();
        if (foundClip) {
            return JSON.parse(JSON.stringify(foundClip));
        }
        return null;
    } catch (err) {
        console.error(err);
        return { message: "Error fetching clip" };
    }
};
