import Link from "next/link";
import { IFile } from "@/lib/action";
import useDownloader from "react-use-downloader";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { EmptyCard } from "@/components/empty-card";
import { Button } from "@/components/ui/button";
import { ArrowDownToLine } from "lucide-react";
import { FileTextIcon } from "@radix-ui/react-icons";

interface PageExistUploadedFilesProps {
    uploadedFiles: IFile[];
}

const truncateFilename = (filename, maxLength = 20) => {
    const extension = filename.split(".").pop(); // Get the file extension
    const baseName = filename.substring(
        0,
        filename.length - extension.length - 1
    );
    if (baseName.length > maxLength) {
        return `${baseName.substring(0, maxLength)}...${extension}`;
    }
    return filename;
};

export function PageExistUploadedFiles({
    uploadedFiles,
}: PageExistUploadedFilesProps) {
    const { download } = useDownloader();
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
                                    <div className="flex flex-1 gap-3 items-center justify-between">
                                        <FileTextIcon
                                            className="size-8 text-muted-foreground justify-center"
                                            aria-hidden="true"
                                        />
                                        <Link href={file.url} target="_blank">
                                            <p className="line-clamp-1 text-sm font-semibold text-foreground/80 hover:underline">
                                                {truncateFilename(file.name)}
                                            </p>
                                        </Link>
                                        <Button
                                            variant="outline"
                                            size="icon"
                                            onClick={() =>
                                                download(file.url, file.name)
                                            }
                                        >
                                            <ArrowDownToLine
                                                size={16}
                                                strokeWidth={1.75}
                                                className=" hover:underline"
                                            />
                                        </Button>
                                    </div>
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
