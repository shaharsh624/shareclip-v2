"use client";

import React, { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useUploadFile } from "@/hooks/use-upload-file";
import { createClip, getClip, GetClipResponse } from "@/lib/action";
import { getErrorMessage } from "@/lib/handle-error";
import { z } from "zod";
import { IClip } from "@/models/clipModel";

import LoadingPage from "../_components/loading";
import { FileUploader } from "@/components/file-uploader";
import { PageExistUploadedFiles } from "../_components/page-exist-uploaded-files";

import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import {
    TooltipProvider,
    Tooltip,
    TooltipTrigger,
    TooltipContent,
} from "@/components/ui/tooltip";

const FormSchema = z.object({
    name: z.string(),
    validity: z.string().nonempty("Please select the validity"),
    text: z.string().optional(),
});

const fileFormSchema = z.object({
    files: z.array(z.instanceof(File)),
});

type FileSchema = z.infer<typeof fileFormSchema>;

interface ClipExistPageProps {
    clipName: string;
    data: IClip; // Assuming data is of type IClip
}

interface ClipNotExistPageProps {
    clipName: string;
}

function ClipPage() {
    const pathname = usePathname();
    const clipName = pathname.replace("/", "");

    const [data, setData] = useState<IClip | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const result: GetClipResponse = await getClip(clipName);
                if (result && "message" in result) {
                    // Handle error message from server action
                    setError(result.message);
                } else {
                    // Set the data if no error
                    setData(result);
                }
            } catch {
                setError("An unexpected error occurred.");
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [clipName]);

    if (loading) {
        return (
            <div>
                <LoadingPage />
            </div>
        );
    }

    if (error) {
        return <div>Error: {error}</div>;
    }

    return data ? (
        <ClipExistPage clipName={clipName} data={data} />
    ) : (
        <ClipNotExistPage clipName={clipName} />
    );
}

const ClipExistPage: React.FC<ClipExistPageProps> = ({ clipName, data }) => {
    const [uploadedFiles] = useState(data.files);
    const [remainingTime, setRemainingTime] = useState(
        calculateRemainingTime(data.expireAt)
    );

    useEffect(() => {
        // Update the remaining time every second
        const interval = setInterval(() => {
            const newRemainingTime = calculateRemainingTime(data.expireAt);
            setRemainingTime(newRemainingTime);

            if (newRemainingTime <= 0) {
                clearInterval(interval);
            }
        }, 1000);

        // Cleanup the interval on component unmount
        return () => clearInterval(interval);
    }, [data.expireAt]);

    function calculateRemainingTime(expireAt: Date) {
        const expirationDate = new Date(expireAt).getTime();
        const now = Date.now();
        return Math.max(0, Math.floor((expirationDate - now) / 1000));
    }

    const formatValidity = (seconds: number) => {
        const days = Math.floor(seconds / (24 * 60 * 60));
        const hours = Math.floor((seconds % (24 * 60 * 60)) / (60 * 60));
        const mins = Math.floor((seconds % (60 * 60)) / 60);
        const secs = seconds % 60;

        if (secs == 0) {
            window.location.reload();
        }

        if (days > 0) {
            return `${days} day${days > 1 ? "s" : ""}, ${hours} hour${
                hours > 1 ? "s" : ""
            }`;
        } else if (hours > 0) {
            return `${hours} hour${hours > 1 ? "s" : ""}, ${mins} minute${
                mins > 1 ? "s" : ""
            }`;
        } else if (mins > 0) {
            return `${mins} minute${mins > 1 ? "s" : ""}, ${secs} second${
                secs > 1 ? "s" : ""
            }`;
        } else {
            return `${secs} second${secs > 1 ? "s" : ""}`;
        }
    };

    function copyText(clipText: string) {
        navigator.clipboard.writeText(clipText);
        toast("Data Copied to Clipboard");
    }

    return (
        <div className="px-20 pt-10">
            <h1 className="font-bold text-3xl">{clipName}</h1>

            <div className="flex gap-6">
                <div className="w-3/4" id="clip-creation-form">
                    <div className="space-y-5 mt-1">
                        <div></div>
                        <div className="space-y-3">
                            <h2 className="text-lg font-medium">Validity</h2>
                            <p>{formatValidity(remainingTime)}</p>
                        </div>
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <h2 className="text-lg font-medium">Text</h2>
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button
                                                variant="outline"
                                                onClick={() =>
                                                    copyText(data.text)
                                                }
                                            >
                                                Copy to Clipboard
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p>Click to copy</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            </div>
                            <Textarea
                                value={data.text}
                                readOnly
                                className="resize-none"
                                rows={20}
                            />
                        </div>
                    </div>
                </div>
                <div className="w-1/4 py-6">
                    <h2 className="text-lg font-medium">Files</h2>
                    <div className="pt-2">
                        {uploadedFiles ? (
                            <div className="space-y-6 w-full">
                                {uploadedFiles.length > 0 ? (
                                    <PageExistUploadedFiles
                                        uploadedFiles={uploadedFiles}
                                    />
                                ) : null}
                            </div>
                        ) : (
                            <div>No File</div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

const ClipNotExistPage: React.FC<ClipNotExistPageProps> = ({ clipName }) => {
    // For: Main Clip Creation Form
    const form = useForm<z.infer<typeof FormSchema>>({
        resolver: zodResolver(FormSchema),
    });

    useEffect(() => {
        form.setValue("name", clipName);
    }, [clipName, form]);

    async function onClipSubmit(data: z.infer<typeof FormSchema>) {
        if (uploadedFiles.length != fileUploadForm.getValues().files.length) {
            toast.warning("Please upload all files before creating the clip");
        } else {
            const formData = {
                ...data,
                files: uploadedFiles.map((file) => ({
                    url: file.url,
                    key: file.key,
                    name: file.name,
                })),
            };
            await createClip(formData);
            toast.success("Clip Created Successfully");
            setTimeout(() => {
                window.location.reload();
            }, 1000);
        }
    }

    // For: File Upload Form
    const [loading, setLoading] = useState(false);
    const { onUpload, progresses, uploadedFiles, isUploading } = useUploadFile(
        "fileUploader",
        { defaultUploadedFiles: [] }
    );
    const fileUploadForm = useForm<FileSchema>({
        resolver: zodResolver(fileFormSchema),
        defaultValues: {
            files: [],
        },
    });

    function onFileSubmit(input: FileSchema) {
        setLoading(true);

        const filesWithCustomId = input.files.map((file) => ({
            file,
            id: clipName,
        }));

        const filesToUpload = filesWithCustomId.map(({ file }) => file);

        toast.promise(onUpload(filesToUpload), {
            loading: "Uploading files...",
            success: () => {
                fileUploadForm.reset();
                setLoading(false);
                return "Files uploaded";
            },
            error: (err) => {
                setLoading(false);
                console.log(getErrorMessage(err));
                return getErrorMessage(err);
            },
        });
    }

    return (
        <div className="px-20 pt-10">
            <h1 className="font-bold text-3xl">{clipName}</h1>

            <div className="flex gap-6">
                <div className="w-3/4" id="clip-creation-form">
                    <Form {...form}>
                        <form
                            id="clip-creation-form"
                            onSubmit={form.handleSubmit(onClipSubmit)}
                            className="space-y-5 mt-1"
                        >
                            <FormField
                                control={form.control}
                                name="name"
                                render={() => (
                                    <FormItem>
                                        <FormControl>
                                            <Input
                                                style={{ display: "none" }}
                                                defaultValue={clipName}
                                            />
                                        </FormControl>
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="validity"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-lg">
                                            Validity
                                        </FormLabel>
                                        <Select
                                            onValueChange={field.onChange}
                                            value={field.value} // Bind the value here
                                        >
                                            <FormControl>
                                                <SelectTrigger className="w-[250px]">
                                                    <SelectValue placeholder="Select Validity" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="60">
                                                    1 Minute
                                                </SelectItem>
                                                <SelectItem value="300">
                                                    5 Minutes
                                                </SelectItem>
                                                <SelectItem value="600">
                                                    10 Minutes
                                                </SelectItem>
                                                <SelectItem value="3600">
                                                    1 Hour
                                                </SelectItem>
                                                <SelectItem value="86400">
                                                    1 Day
                                                </SelectItem>
                                                <SelectItem value="604800">
                                                    1 Week
                                                </SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="text"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-lg">
                                            Text
                                        </FormLabel>
                                        <FormControl>
                                            <Textarea
                                                placeholder="Write some text to share"
                                                className="resize-none"
                                                rows={20}
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            type="submit"
                                            className="w-full"
                                            variant="secondary"
                                        >
                                            Create Clip
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>Click to create clip</p>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        </form>
                    </Form>
                </div>
                <div className="w-1/4 py-6">
                    <Form {...fileUploadForm}>
                        <form
                            id="file-upload-form"
                            onSubmit={fileUploadForm.handleSubmit(onFileSubmit)}
                            className="flex w-full flex-col gap-6"
                        >
                            <FormField
                                control={fileUploadForm.control}
                                name="files"
                                render={({ field }) => (
                                    <div className="space-y-6">
                                        <FormItem className="w-full">
                                            <FormLabel className="text-lg">
                                                Files
                                            </FormLabel>
                                            <FormControl>
                                                <FileUploader
                                                    value={field.value}
                                                    onValueChange={
                                                        field.onChange
                                                    }
                                                    maxFileCount={4}
                                                    maxSize={4 * 1024 * 1024}
                                                    progresses={progresses}
                                                    disabled={isUploading}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                        {uploadedFiles.length > 0 ? (
                                            <PageExistUploadedFiles
                                                uploadedFiles={uploadedFiles}
                                            />
                                        ) : null}
                                    </div>
                                )}
                            />

                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            disabled={loading}
                                        >
                                            Upload
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>Upload files</p>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        </form>
                    </Form>
                </div>
            </div>
        </div>
    );
};

export default ClipPage;
