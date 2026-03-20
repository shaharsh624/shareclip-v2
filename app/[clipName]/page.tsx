"use client";

import React, { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useUploadFile } from "@/hooks/use-upload-file";
import {
    createClip,
    getClipMeta,
    getClipContent,
    IClipMeta,
} from "@/lib/action";
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
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    AlertDialog,
    AlertDialogContent,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import Navbar from "@/components/navbar";
import { Label } from "@/components/ui/label";
import {
    Copy,
    Check,
    Clock,
    Lock,
    FileUp,
    Plus,
    Clipboard,
    Timer,
    ShieldCheck,
    ExternalLink,
    Loader2,
} from "lucide-react";
import Link from "next/link";

/** Returns the URL if the entire text is a single valid http/https URL, else null */
function isOnlyUrl(text: string | undefined): string | null {
    if (!text) return null;
    const trimmed = text.trim();
    if (/\s/.test(trimmed)) return null;
    try {
        const url = new URL(trimmed);
        if (url.protocol === "http:" || url.protocol === "https:")
            return trimmed;
    } catch {
        return null;
    }
    return null;
}

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
    data: IClip;
}

interface ClipNotExistPageProps {
    clipName: string;
}

/* ─────────────────────────────────────────────
   Root: two-step secure fetch
   Step 1 — getClipMeta: learns only whether the
            clip exists and whether it needs a password.
            No content ever reaches the client here.
   Step 2 — getClipContent: called only after the
            password is verified SERVER-SIDE.
            Content is returned only on success.
───────────────────────────────────────────── */
function ClipPage() {
    const pathname = usePathname();
    const clipName = pathname.replace("/", "");

    // Step 1 state — metadata only
    const [meta, setMeta] = useState<IClipMeta | null>(null);
    const [metaLoading, setMetaLoading] = useState(true);
    const [metaError, setMetaError] = useState<string | null>(null);

    // Step 2 state — full content, only populated after auth
    const [clipData, setClipData] = useState<IClip | null>(null);
    const [contentLoading, setContentLoading] = useState(false);

    // Step 1: fetch metadata on mount
    useEffect(() => {
        const fetchMeta = async () => {
            setMetaLoading(true);
            try {
                const result = await getClipMeta(clipName);
                if (!result) {
                    setMeta(null); // clip doesn't exist → create page
                } else if ("message" in result) {
                    setMetaError(result.message);
                } else {
                    setMeta(result);
                    // If no password, immediately fetch content
                    if (!result.hasPassword) {
                        fetchContent(undefined);
                    }
                }
            } catch {
                setMetaError("An unexpected error occurred.");
            } finally {
                setMetaLoading(false);
            }
        };
        fetchMeta();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [clipName]);

    // Step 2: fetch full content — only called when password is correct (or absent)
    const fetchContent = async (password: string | undefined) => {
        setContentLoading(true);
        try {
            const result = await getClipContent(clipName, password);
            if (!result) {
                setClipData(null);
            } else if ("message" in result) {
                // Wrong password comes back here
                return result.message;
            } else {
                setClipData(result as unknown as IClip);
            }
        } catch {
            setMetaError("An unexpected error occurred.");
        } finally {
            setContentLoading(false);
        }
        return null;
    };

    // ── Loading states ──
    if (metaLoading) return <LoadingPage />;
    if (metaError)
        return <div className="p-8 text-destructive">Error: {metaError}</div>;

    // ── Clip doesn't exist → creation page ──
    if (!meta) return <ClipNotExistPage clipName={clipName} />;

    // ── Content still loading (no-password clip, waiting for step 2) ──
    if (contentLoading || (!clipData && !meta.hasPassword))
        return <LoadingPage />;

    // ── Password required, content not yet fetched → show lock screen ──
    if (meta.hasPassword && !clipData) {
        return <PasswordGate clipName={clipName} onUnlock={fetchContent} />;
    }

    // ── Unlocked — show full clip ──
    return <ClipExistPage clipName={clipName} data={clipData!} />;
}

/* ─────────────────────────────────────────────
   Password Gate
   Calls getClipContent server-side on submit.
   Content is only shown on server-verified success.
───────────────────────────────────────────── */
const PasswordGate: React.FC<{
    clipName: string;
    onUnlock: (password: string) => Promise<string | null>;
}> = ({ clipName, onUnlock }) => {
    const [passwordEntered, setPasswordEntered] = useState("");
    const [wrong, setWrong] = useState(false);
    const [checking, setChecking] = useState(false);

    async function handleUnlock() {
        if (!passwordEntered) return;
        setChecking(true);
        setWrong(false);
        const error = await onUnlock(passwordEntered);
        setChecking(false);
        if (error) {
            setWrong(true);
            setTimeout(() => setWrong(false), 800);
        }
        // On success, parent state update re-renders automatically
    }

    return (
        <AlertDialog open>
            <AlertDialogContent className="border border-border/60 bg-card shadow-2xl max-w-sm rounded-2xl p-0 overflow-hidden">
                <div className="bg-gradient-to-br from-emerald-500/10 via-transparent to-transparent p-6 pb-0">
                    <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 mb-4">
                        <ShieldCheck className="w-6 h-6 text-emerald-400" />
                    </div>
                    <AlertDialogHeader className="pb-4">
                        <AlertDialogTitle className="text-xl font-semibold tracking-tight">
                            Protected Clip
                        </AlertDialogTitle>
                        <p className="text-sm text-muted-foreground">
                            <span className="font-mono text-foreground/70 bg-muted px-1.5 py-0.5 rounded text-xs">
                                {clipName}
                            </span>{" "}
                            requires a password to access.
                        </p>
                    </AlertDialogHeader>
                </div>
                <div className="px-6 py-4 space-y-3">
                    <Label htmlFor="password" className="text-sm font-medium">
                        Password
                    </Label>
                    <Input
                        id="password"
                        type="password"
                        placeholder="Enter password…"
                        className={`transition-all duration-200 ${
                            wrong ? "border-red-500 ring-1 ring-red-500" : ""
                        }`}
                        value={passwordEntered}
                        onChange={(e) => setPasswordEntered(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleUnlock()}
                        disabled={checking}
                    />
                    {wrong && (
                        <p className="text-xs text-red-400">
                            Incorrect password. Try again.
                        </p>
                    )}
                </div>
                <AlertDialogFooter className="px-6 pb-6">
                    <Button
                        className="w-full bg-emerald-600 hover:bg-emerald-500 text-white"
                        onClick={handleUnlock}
                        disabled={checking}
                    >
                        {checking ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                            <Lock className="w-4 h-4 mr-2" />
                        )}
                        {checking ? "Verifying…" : "Unlock Clip"}
                    </Button>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
};

/* ─────────────────────────────────────────────
   Existing Clip View
───────────────────────────────────────────── */
const ClipExistPage: React.FC<ClipExistPageProps> = ({ clipName, data }) => {
    const [uploadedFiles] = useState(data.files);
    const [remainingTime, setRemainingTime] = useState(
        calculateRemainingTime(data.expireAt),
    );
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        const interval = setInterval(() => {
            const t = calculateRemainingTime(data.expireAt);
            setRemainingTime(t);
            if (t <= 0) {
                clearInterval(interval);
                window.location.reload();
            }
        }, 1000);
        return () => clearInterval(interval);
    }, [data.expireAt]);

    function calculateRemainingTime(expireAt: Date) {
        return Math.max(
            0,
            Math.floor((new Date(expireAt).getTime() - Date.now()) / 1000),
        );
    }

    function copyText() {
        navigator.clipboard.writeText(data.text);
        setCopied(true);
        toast.success("Copied to clipboard");
        setTimeout(() => setCopied(false), 2000);
    }

    const urgency =
        remainingTime < 300
            ? "critical"
            : remainingTime < 3600
              ? "warning"
              : "normal";

    const urgencyColors = {
        critical: "text-red-400 bg-red-500/10 border-red-500/20",
        warning: "text-amber-400 bg-amber-500/10 border-amber-500/20",
        normal: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
    };

    const formatTime = (seconds: number) => {
        const d = Math.floor(seconds / 86400);
        const h = Math.floor((seconds % 86400) / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        if (d > 0) return `${d}d ${h}h remaining`;
        if (h > 0) return `${h}h ${m}m remaining`;
        if (m > 0) return `${m}m ${s}s remaining`;
        return `${s}s remaining`;
    };

    const expiresAt = new Date(data.expireAt).toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });

    return (
        <div className="h-screen overflow-hidden flex flex-col bg-background">
            <Navbar />
            <div className="flex-1 min-h-0 overflow-hidden">
                <div className="h-full max-w-7xl mx-auto px-4 md:px-8 py-6 flex flex-col gap-4">
                    {/* Header */}
                    <div className="shrink-0 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div>
                            <Link
                                href="https://shareclip.harshshah.me"
                                target="_blank"
                            >
                                <span className="text-xs font-mono text-muted-foreground lowercase tracking-widest hover:text-foreground transition-colors hover:underline">
                                    shareclip.harshshah.me/
                                </span>
                            </Link>
                            <h1 className="text-2xl font-bold tracking-tight font-mono leading-tight">
                                {clipName}
                            </h1>
                        </div>
                        <div
                            className={`inline-flex items-center gap-2.5 px-4 py-2 rounded-xl border text-sm font-medium shrink-0 ${urgencyColors[urgency]}`}
                        >
                            <Timer className="w-4 h-4 shrink-0" />
                            <div className="flex flex-col leading-tight">
                                <span className="font-semibold tabular-nums">
                                    {formatTime(remainingTime)}
                                </span>
                                <span className="text-xs opacity-70 font-normal">
                                    Expires {expiresAt}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="shrink-0 h-px bg-border" />

                    {/* Grid */}
                    <div
                        className={`flex-1 min-h-0 grid gap-6 ${uploadedFiles && uploadedFiles.length > 0 ? "grid-cols-1 lg:grid-cols-3" : "grid-cols-1"}`}
                    >
                        <div
                            className={`flex flex-col min-h-0 gap-3 ${uploadedFiles && uploadedFiles.length > 0 ? "lg:col-span-2" : ""}`}
                        >
                            {/* Toolbar */}
                            <div className="shrink-0 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="w-1.5 h-5 rounded-full bg-emerald-500" />
                                    <h2 className="text-sm font-semibold">
                                        Content
                                    </h2>
                                </div>
                                <div className="flex items-center gap-2">
                                    {isOnlyUrl(data.text) && (
                                        <TooltipProvider>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        asChild
                                                        className="gap-2 border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10 hover:text-emerald-300"
                                                    >
                                                        <Link
                                                            href={
                                                                isOnlyUrl(
                                                                    data.text,
                                                                )!
                                                            }
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                        >
                                                            <ExternalLink className="w-3.5 h-3.5" />
                                                            Redirect
                                                        </Link>
                                                    </Button>
                                                </TooltipTrigger>
                                                <TooltipContent>
                                                    Open link in new tab
                                                </TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>
                                    )}
                                    <TooltipProvider>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={copyText}
                                                    className={`gap-2 transition-all ${copied ? "border-emerald-500/50 text-emerald-400" : ""}`}
                                                >
                                                    {copied ? (
                                                        <Check className="w-3.5 h-3.5" />
                                                    ) : (
                                                        <Copy className="w-3.5 h-3.5" />
                                                    )}
                                                    {copied
                                                        ? "Copied!"
                                                        : "Copy"}
                                                </Button>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                Copy text to clipboard
                                            </TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                </div>
                            </div>

                            {/* Textarea */}
                            <div className="flex-1 min-h-0 relative rounded-xl border border-border bg-muted/30 overflow-hidden">
                                <Textarea
                                    value={data.text || ""}
                                    readOnly
                                    className="h-full w-full resize-none border-0 bg-transparent focus-visible:ring-0 font-mono text-sm leading-relaxed p-5 overflow-y-auto"
                                />
                                {!data.text && (
                                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                        <p className="text-muted-foreground/50 text-sm">
                                            No text content in this clip.
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Files sidebar */}
                        <div className="min-h-0 overflow-y-auto space-y-4 pb-1">
                            {uploadedFiles && uploadedFiles.length > 0 && (
                                <div className="rounded-xl border border-border bg-card overflow-hidden">
                                    <div className="px-4 py-3 border-b border-border flex items-center gap-2">
                                        <div className="w-1.5 h-5 rounded-full bg-emerald-500" />
                                        <h3 className="text-sm font-semibold">
                                            Files
                                        </h3>
                                        <span className="ml-auto text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full">
                                            {uploadedFiles.length}
                                        </span>
                                    </div>
                                    <div className="p-3">
                                        <PageExistUploadedFiles
                                            uploadedFiles={uploadedFiles}
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

/* ─────────────────────────────────────────────
   New Clip Creation Page
───────────────────────────────────────────── */
const ClipNotExistPage: React.FC<ClipNotExistPageProps> = ({ clipName }) => {
    const [password, setPassword] = useState("");

    const form = useForm<z.infer<typeof FormSchema>>({
        resolver: zodResolver(FormSchema),
    });

    useEffect(() => {
        form.setValue("name", clipName);
    }, [clipName, form]);

    async function onClipSubmit(data: z.infer<typeof FormSchema>) {
        const formData = {
            ...data,
            password,
            files: uploadedFiles.map((file) => ({
                url: file.url,
                key: file.key,
                name: file.name,
            })),
        };
        await createClip(formData);
        toast.success("Clip created successfully!");
        setTimeout(() => window.location.reload(), 1000);
    }

    const [loading, setLoading] = useState(false);
    const { onUpload, progresses, uploadedFiles, isUploading } = useUploadFile(
        "fileUploader",
        { defaultUploadedFiles: [] },
    );

    const fileUploadForm = useForm<FileSchema>({
        resolver: zodResolver(fileFormSchema),
        defaultValues: { files: [] },
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
                return getErrorMessage(err);
            },
        });
    }

    const validityOptions = [
        { value: "60", label: "1 Minute" },
        { value: "300", label: "5 Minutes" },
        { value: "600", label: "10 Minutes" },
        { value: "3600", label: "1 Hour" },
        { value: "86400", label: "1 Day" },
        { value: "604800", label: "1 Week" },
        { value: "2592000", label: "1 Month" },
    ];

    return (
        <div className="h-screen overflow-hidden flex flex-col bg-background">
            <Navbar />
            <div className="flex-1 min-h-0 overflow-hidden">
                <div className="h-full max-w-7xl mx-auto px-4 md:px-8 py-6 flex flex-col gap-4">
                    {/* Header */}
                    <div className="shrink-0 space-y-0.5">
                        <Link
                            href="https://shareclip.harshshah.me"
                            target="_blank"
                        >
                            <span className="text-xs font-mono text-muted-foreground lowercase tracking-widest hover:underline">
                                shareclip.harshshah.me/
                            </span>
                        </Link>
                        <div className="flex items-center gap-3">
                            <h1 className="text-2xl font-bold tracking-tight font-mono">
                                {clipName}
                            </h1>
                        </div>
                    </div>

                    <div className="shrink-0 h-px bg-border" />

                    {/* Grid */}
                    <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2 flex flex-col min-h-0">
                            <Form {...form}>
                                <form
                                    onSubmit={form.handleSubmit(onClipSubmit)}
                                    className="flex flex-col h-full gap-4"
                                >
                                    <FormField
                                        control={form.control}
                                        name="name"
                                        render={() => (
                                            <FormItem className="hidden">
                                                <FormControl>
                                                    <Input
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
                                            <FormItem className="shrink-0">
                                                <FormLabel className="flex items-center gap-2 text-sm font-semibold">
                                                    <Clock className="w-4 h-4 text-muted-foreground" />
                                                    Clip Validity
                                                </FormLabel>
                                                <Select
                                                    onValueChange={
                                                        field.onChange
                                                    }
                                                    value={field.value}
                                                >
                                                    <FormControl>
                                                        <SelectTrigger className="w-[220px] rounded-lg">
                                                            <SelectValue placeholder="Choose duration" />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        {validityOptions.map(
                                                            (opt) => (
                                                                <SelectItem
                                                                    key={
                                                                        opt.value
                                                                    }
                                                                    value={
                                                                        opt.value
                                                                    }
                                                                >
                                                                    {opt.label}
                                                                </SelectItem>
                                                            ),
                                                        )}
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
                                            <FormItem className="flex flex-col flex-1 min-h-0">
                                                <FormLabel className="shrink-0 flex items-center gap-2 text-sm font-semibold">
                                                    <Clipboard className="w-4 h-4 text-muted-foreground" />
                                                    Content
                                                </FormLabel>
                                                <FormControl className="flex-1 min-h-0">
                                                    <div className="flex-1 min-h-0 rounded-xl border border-border bg-muted/30 overflow-hidden focus-within:border-emerald-500/50 focus-within:ring-1 focus-within:ring-emerald-500/20 transition-all">
                                                        <Textarea
                                                            placeholder="Paste or type your content here — code, notes, links, anything…"
                                                            className="h-full w-full resize-none border-0 bg-transparent focus-visible:ring-0 font-mono text-sm leading-relaxed p-5"
                                                            {...field}
                                                        />
                                                    </div>
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <div className="shrink-0">
                                        <Dialog>
                                            <DialogTrigger asChild>
                                                <Button
                                                    className="w-full h-10 font-semibold gap-2 bg-emerald-600 hover:bg-emerald-500 text-white"
                                                    type="button"
                                                >
                                                    <Plus className="w-4 h-4" />
                                                    Create Clip
                                                </Button>
                                            </DialogTrigger>
                                            <DialogContent className="sm:max-w-[400px] rounded-2xl">
                                                <DialogHeader>
                                                    <DialogTitle className="flex items-center gap-2">
                                                        <Lock className="w-4 h-4 text-muted-foreground" />
                                                        Add a password?
                                                    </DialogTitle>
                                                </DialogHeader>
                                                <div className="space-y-3 py-2">
                                                    <Label htmlFor="password">
                                                        Password
                                                    </Label>
                                                    <Input
                                                        id="password"
                                                        type="password"
                                                        placeholder="Leave empty for no protection"
                                                        className="rounded-lg"
                                                        value={password}
                                                        onChange={(e) =>
                                                            setPassword(
                                                                e.target.value,
                                                            )
                                                        }
                                                    />
                                                    <p className="text-xs text-muted-foreground">
                                                        ⚠️ There&apos;s no way
                                                        to recover a forgotten
                                                        password.
                                                    </p>
                                                </div>
                                                <DialogFooter>
                                                    <Button
                                                        className="w-full bg-emerald-600 hover:bg-emerald-500 text-white"
                                                        onClick={form.handleSubmit(
                                                            onClipSubmit,
                                                        )}
                                                    >
                                                        Create Clip
                                                    </Button>
                                                </DialogFooter>
                                            </DialogContent>
                                        </Dialog>
                                    </div>
                                </form>
                            </Form>
                        </div>

                        {/* File upload sidebar */}
                        <div className="min-h-0 overflow-y-auto space-y-4 pb-1">
                            <div className="rounded-xl border border-border bg-card overflow-hidden">
                                <div className="px-4 py-3 border-b border-border flex items-center gap-2">
                                    <div className="w-1.5 h-5 rounded-full bg-emerald-500" />
                                    <h3 className="text-sm font-semibold">
                                        Files
                                    </h3>
                                </div>
                                <div className="p-4">
                                    <Form {...fileUploadForm}>
                                        <form
                                            onSubmit={fileUploadForm.handleSubmit(
                                                onFileSubmit,
                                            )}
                                            className="flex flex-col gap-4"
                                        >
                                            <FormField
                                                control={fileUploadForm.control}
                                                name="files"
                                                render={({ field }) => (
                                                    <div className="space-y-4">
                                                        <FormItem className="w-full">
                                                            <FormControl>
                                                                <FileUploader
                                                                    value={
                                                                        field.value
                                                                    }
                                                                    onValueChange={
                                                                        field.onChange
                                                                    }
                                                                    maxFileCount={
                                                                        4
                                                                    }
                                                                    maxSize={
                                                                        4 *
                                                                        1024 *
                                                                        1024
                                                                    }
                                                                    progresses={
                                                                        progresses
                                                                    }
                                                                    disabled={
                                                                        isUploading
                                                                    }
                                                                />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                        {uploadedFiles.length >
                                                            0 && (
                                                            <PageExistUploadedFiles
                                                                uploadedFiles={
                                                                    uploadedFiles
                                                                }
                                                            />
                                                        )}
                                                    </div>
                                                )}
                                            />
                                            <TooltipProvider>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            className="w-full rounded-lg gap-2"
                                                            disabled={loading}
                                                            type="submit"
                                                        >
                                                            <FileUp className="w-4 h-4" />
                                                            {loading
                                                                ? "Uploading…"
                                                                : "Upload Files"}
                                                        </Button>
                                                    </TooltipTrigger>
                                                    <TooltipContent>
                                                        Upload files to this
                                                        clip
                                                    </TooltipContent>
                                                </Tooltip>
                                            </TooltipProvider>
                                        </form>
                                    </Form>
                                </div>
                            </div>

                            <div className="rounded-xl border border-border bg-card p-4 space-y-3">
                                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                    Tips
                                </h3>
                                <ul className="space-y-2 text-xs text-muted-foreground">
                                    <li className="flex gap-2">
                                        <span className="text-emerald-400 mt-0.5">
                                            ✦
                                        </span>
                                        Share the URL with anyone — no signup
                                        needed.
                                    </li>
                                    <li className="flex gap-2">
                                        <span className="text-emerald-400 mt-0.5">
                                            ✦
                                        </span>
                                        Clip auto-deletes after the chosen
                                        duration.
                                    </li>
                                    <li className="flex gap-2">
                                        <span className="text-emerald-400 mt-0.5">
                                            ✦
                                        </span>
                                        Add a password to keep your content
                                        private.
                                    </li>
                                    <li className="flex gap-2">
                                        <span className="text-emerald-400 mt-0.5">
                                            ✦
                                        </span>
                                        Upload files alongside your text.
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ClipPage;
