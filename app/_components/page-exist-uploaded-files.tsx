import Image from "next/image";

import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { EmptyCard } from "@/components/empty-card";
import { FileTextIcon } from "@radix-ui/react-icons";
import { formatBytes } from "@/lib/utils";
import Link from "next/link";
import { IFile } from "@/lib/action";

interface PageExistUploadedFilesProps {
    uploadedFiles: IFile[];
}

export function PageExistUploadedFiles({
    uploadedFiles,
}: PageExistUploadedFilesProps) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Uploaded files</CardTitle>
                <CardDescription>View the uploaded files here</CardDescription>
            </CardHeader>
            <CardContent>
                {uploadedFiles.length > 0 ? (
                    <ScrollArea className="pb-4">
                        <div className="flex w-max space-y-4 flex-col">
                            {uploadedFiles.map((file) => (
                                <div key={file.key} className="">
                                    <Link href={file.url} target="_blank">
                                        <div className="flex flex-1 gap-2.5">
                                            <FileTextIcon
                                                className="size-10 text-muted-foreground justify-center"
                                                aria-hidden="true"
                                            />
                                            <div className="flex w-full flex-col gap-2">
                                                <div className="flex flex-col gap-px">
                                                    <p className="line-clamp-1 text-sm font-medium text-foreground/80 hover:underline">
                                                        {file.name}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </Link>
                                </div>
                            ))}
                        </div>
                        <ScrollBar orientation="horizontal" />
                    </ScrollArea>
                ) : (
                    <EmptyCard
                        title="No files uploaded"
                        description="Upload some files to see them here"
                        className="w-full"
                    />
                )}
            </CardContent>
        </Card>
    );
}
