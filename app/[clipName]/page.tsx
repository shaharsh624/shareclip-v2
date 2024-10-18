"use client";

import React, { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useUploadFile } from "@/hooks/use-upload-file";
import { createClip } from "@/lib/action";
import { getErrorMessage } from "@/lib/handle-error";
import { z } from "zod";

import { FileUploader } from "@/components/file-uploader";
import { UploadedFilesCard } from "../_components/uploaded-files-card";

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

const FormSchema = z.object({
    name: z.string(),
    validity: z.string().nonempty("Please select the validity"),
    text: z.string().optional(),
});

const fileFormSchema = z.object({
    files: z.array(z.instanceof(File)),
});

type FileSchema = z.infer<typeof fileFormSchema>;

const ClipPage = () => {
    const pathname = usePathname();
    const [clipName] = useState(pathname.replace("/", ""));

    // For: Mail Clip Creation Form
    const form = useForm<z.infer<typeof FormSchema>>({
        resolver: zodResolver(FormSchema),
    });

    useEffect(() => {
        form.setValue("name", clipName);
    }, [clipName, form]);

    async function onClipSubmit(data: z.infer<typeof FormSchema>) {
        const formData = {
            ...data,
            files: uploadedFiles.map((file) => ({
                url: file.url,
                key: file.key,
                name: file.name,
            })),
        };
        await createClip(formData);
        console.log("-- My Form Data", formData);
        toast.success("Clip Created Successfully");
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

        toast.promise(onUpload(input.files), {
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
                                                <SelectItem value="2592000">
                                                    1 Month
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
                            <Button type="submit" className="w-full">
                                Create Clip
                            </Button>
                        </form>
                    </Form>
                </div>
                <div className="w-1/4 py-6">
                    <Form {...fileUploadForm} id="file-upload-form">
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
                                            <UploadedFilesCard
                                                uploadedFiles={uploadedFiles}
                                            />
                                        ) : null}
                                    </div>
                                )}
                            />
                            <Button
                                size="sm"
                                variant="secondary"
                                disabled={loading}
                            >
                                Upload
                            </Button>
                        </form>
                    </Form>
                </div>
            </div>
        </div>
    );
};

export default ClipPage;
