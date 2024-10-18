"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { getErrorMessage } from "@/lib/handle-error";
import { useUploadFile } from "@/hooks/use-upload-file";
import { Button } from "@/components/ui/button";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { FileUploader } from "@/components/file-uploader";

import { UploadedFilesCard } from "./uploaded-files-card";

const fileFormSchema = z.object({
    files: z.array(z.instanceof(File)),
});

type FileSchema = z.infer<typeof fileFormSchema>;

export function ReactHookForm() {
    const [loading, setLoading] = React.useState(false);
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
        <Form {...fileUploadForm}>
            <form
                onSubmit={fileUploadForm.handleSubmit(onFileSubmit)}
                className="flex w-full flex-col gap-6"
            >
                <FormField
                    control={fileUploadForm.control}
                    name="files"
                    render={({ field }) => (
                        <div className="space-y-6">
                            <FormItem className="w-full">
                                <FormLabel className="text-lg">Files</FormLabel>
                                <FormControl>
                                    <FileUploader
                                        value={field.value}
                                        onValueChange={field.onChange}
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
                <Button size="sm" variant="secondary" disabled={loading}>
                    Upload
                </Button>
            </form>
        </Form>
    );
}
