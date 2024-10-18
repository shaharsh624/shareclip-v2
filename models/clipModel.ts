import mongoose, { Document, Model } from "mongoose";

export interface IFile {
    url: string;
    key: string;
    name: string;
}

export interface IClip {
    name: string;
    validity: number;
    text: string;
    files?: IFile[];
}

export interface IClipDocument extends IClip, Document {
    createdAt: Date;
    updatedAt: Date;
}
const fileSchema = new mongoose.Schema<IFile>({
    url: {
        type: String,
        required: true,
    },
    key: {
        type: String,
        required: true,
    },
    name: {
        type: String,
        required: true,
    },
});

const clipSchema = new mongoose.Schema<IClipDocument>(
    {
        name: {
            type: String,
            required: true,
            unique: true,
        },
        validity: {
            type: Number,
            required: true,
        },
        text: {
            type: String,
            required: false,
        },
        files: {
            type: [fileSchema],
            required: false,
        },
    },
    {
        timestamps: true,
    }
);

const Clip: Model<IClipDocument> =
    mongoose.models?.Clip || mongoose.model("Clip", clipSchema);

export default Clip;
