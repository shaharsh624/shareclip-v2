"use server";
import Clip, { IClipDocument } from "@/models/clipModel";
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
    password?: string;
}

export interface IClipError {
    message: string;
}

// Lightweight metadata — never includes text, files, or the password value.
// Only tells the client: does the clip exist, and is it password-protected?
export interface IClipMeta {
    name: string;
    hasPassword: boolean;
    expireAt: Date;
    validity: number;
}

export type GetClipResponse = IClipDocument | IClipError | null;
export type GetClipMetaResponse = IClipMeta | IClipError | null;

/* ─── createClip ─────────────────────────────────────────── */
export const createClip = async (formData: IFormData) => {
    await connectToMongoDB();
    const name = formData["name"];
    const validity = Number(formData["validity"]);
    const text = formData["text"];
    const password = formData["password"];
    const files = formData["files"];
    const expireAt = new Date(Date.now() + validity * 1000);
    try {
        const newClip = await Clip.create({
            name,
            validity,
            text,
            password,
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

/* ─── getClipMeta ────────────────────────────────────────────
   Safe to call unconditionally. Returns only:
     - whether the clip exists
     - whether it requires a password
     - expiry / validity for the timer
   Never returns text, files, or the password value.
─────────────────────────────────────────────────────────── */
export const getClipMeta = async (
    clipName: string,
): Promise<GetClipMetaResponse> => {
    try {
        await connectToMongoDB();
        const foundClip = await Clip.findOne({ name: clipName })
            .select("name password expireAt validity")
            .lean();

        if (!foundClip) return null;

        return {
            name: foundClip.name,
            hasPassword: Boolean(foundClip.password),
            expireAt: foundClip.expireAt,
            validity: foundClip.validity,
        };
    } catch (err) {
        console.error(err);
        return { message: "Error fetching clip" };
    }
};

/* ─── getClipContent ─────────────────────────────────────────
   Returns the full clip (text + files) only after verifying
   the password server-side. The password is never sent to the
   client — comparison happens here on the server.
─────────────────────────────────────────────────────────── */
export const getClipContent = async (
    clipName: string,
    password?: string,
): Promise<GetClipResponse> => {
    try {
        await connectToMongoDB();
        const foundClip = await Clip.findOne({ name: clipName }).lean();

        if (!foundClip) return null;

        // If the clip is password-protected, verify before returning anything
        if (foundClip.password) {
            if (!password || foundClip.password !== password) {
                return { message: "Incorrect password" };
            }
        }

        // Strip the password field before sending to the client
        const { password: _pw, ...safeClip } = foundClip as typeof foundClip & {
            password?: string;
        };
        void _pw;
        return JSON.parse(JSON.stringify(safeClip));
    } catch (err) {
        console.error(err);
        return { message: "Error fetching clip" };
    }
};

/* ─── getClip (kept for any legacy references) ───────────── */
export const getClip = async (clipName: string) => {
    try {
        await connectToMongoDB();
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
