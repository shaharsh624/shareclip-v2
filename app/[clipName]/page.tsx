"use client";

import React, { useEffect, useState, useMemo } from "react";
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
import { useTheme } from "next-themes";

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
    Link2,
    QrCode,
    CalendarIcon,
} from "lucide-react";
import Link from "next/link";
import { format, addMinutes } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";

import SyntaxHighlighter from "react-syntax-highlighter";
import {
    atomOneDark,
    atomOneLight,
} from "react-syntax-highlighter/dist/esm/styles/hljs";
import hljs from "highlight.js";
import { QRCodeSVG } from "qrcode.react";

/* ─────────────────────────────────────────────
   Helpers
───────────────────────────────────────────── */

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

/** Auto-detect language using highlight.js */
function detectLanguage(text: string): string {
    if (!text || text.length < 10) return "plaintext";
    try {
        const result = hljs.highlightAuto(text, [
            "javascript",
            "typescript",
            "python",
            "json",
            "html",
            "css",
            "bash",
            "shell",
            "sql",
            "markdown",
            "xml",
            "yaml",
            "rust",
            "go",
            "java",
            "cpp",
            "c",
            "php",
            "ruby",
            "swift",
            "kotlin",
            "scala",
            "r",
            "dart",
        ]);
        return result.language || "plaintext";
    } catch {
        return "plaintext";
    }
}

/* ─────────────────────────────────────────────
   Shadcn DateTimePicker
   Combines a Calendar popover for the date with
   a time input inside the same popover.
───────────────────────────────────────────── */
const DateTimePicker: React.FC<{
    value: Date | undefined;
    onChange: (date: Date | undefined) => void;
    minDate?: Date;
}> = ({ value, onChange, minDate }) => {
    const [open, setOpen] = useState(false);
    const [timeStr, setTimeStr] = useState(() =>
        value
            ? format(value, "HH:mm")
            : format(addMinutes(new Date(), 5), "HH:mm"),
    );

    function handleDaySelect(day: Date | undefined) {
        if (!day) {
            onChange(undefined);
            return;
        }
        const [h, m] = timeStr.split(":").map(Number);
        const combined = new Date(day);
        combined.setHours(h, m, 0, 0);
        onChange(combined);
    }

    function handleTimeChange(e: React.ChangeEvent<HTMLInputElement>) {
        setTimeStr(e.target.value);
        if (!value) return;
        const [h, m] = e.target.value.split(":").map(Number);
        const updated = new Date(value);
        updated.setHours(h, m, 0, 0);
        onChange(updated);
    }

    const displayLabel = value
        ? format(value, "MMM d, yyyy 'at' h:mm a")
        : "Pick a date & time";

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    className={`w-[240px] justify-start gap-2 text-left font-normal rounded-lg \${!value ? "text-muted-foreground" : ""}`}
                >
                    <CalendarIcon className="w-4 h-4 shrink-0" />
                    {displayLabel}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                    mode="single"
                    selected={value}
                    onSelect={handleDaySelect}
                    disabled={(d) => (minDate ? d < minDate : false)}
                    initialFocus
                />
                <div className="border-t border-border px-3 py-3 flex items-center gap-3">
                    <Clock className="w-4 h-4 text-muted-foreground shrink-0" />
                    <label className="text-xs text-muted-foreground">
                        Time
                    </label>
                    <input
                        type="time"
                        value={timeStr}
                        onChange={handleTimeChange}
                        className="ml-auto h-8 rounded-md border border-input bg-input px-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 focus:ring-offset-background"
                    />
                </div>
            </PopoverContent>
        </Popover>
    );
};

/* ─────────────────────────────────────────────
   Schemas
───────────────────────────────────────────── */
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
   Root — two-step secure fetch
───────────────────────────────────────────── */
function ClipPage() {
    const pathname = usePathname();
    const clipName = pathname.replace("/", "");

    const [meta, setMeta] = useState<IClipMeta | null>(null);
    const [metaLoading, setMetaLoading] = useState(true);
    const [metaError, setMetaError] = useState<string | null>(null);
    const [clipData, setClipData] = useState<IClip | null>(null);
    const [contentLoading, setContentLoading] = useState(false);

    useEffect(() => {
        const fetchMeta = async () => {
            setMetaLoading(true);
            try {
                const result = await getClipMeta(clipName);
                if (!result) {
                    setMeta(null);
                } else if ("message" in result) {
                    setMetaError(result.message);
                } else {
                    setMeta(result);
                    if (!result.hasPassword) fetchContent(undefined);
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

    const fetchContent = async (password: string | undefined) => {
        setContentLoading(true);
        try {
            const result = await getClipContent(clipName, password);
            if (!result) {
                setClipData(null);
            } else if ("message" in result) {
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

    if (metaLoading) return <LoadingPage />;
    if (metaError)
        return <div className="p-8 text-destructive">Error: {metaError}</div>;
    if (!meta) return <ClipNotExistPage clipName={clipName} />;
    if (contentLoading || (!clipData && !meta.hasPassword))
        return <LoadingPage />;
    if (meta.hasPassword && !clipData) {
        return <PasswordGate clipName={clipName} onUnlock={fetchContent} />;
    }
    return <ClipExistPage clipName={clipName} data={clipData!} />;
}

/* ─────────────────────────────────────────────
   QR Code Dialog
───────────────────────────────────────────── */
const QRDialog: React.FC<{ url: string; clipName: string }> = ({
    url,
    clipName,
}) => {
    return (
        <Dialog>
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <DialogTrigger asChild>
                            <Button
                                variant="outline"
                                size="sm"
                                className="gap-2"
                            >
                                <QrCode className="w-3.5 h-3.5" />
                                QR
                            </Button>
                        </DialogTrigger>
                    </TooltipTrigger>
                    <TooltipContent>Show QR code for this clip</TooltipContent>
                </Tooltip>
            </TooltipProvider>
            <DialogContent className="sm:max-w-[320px] rounded-2xl">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-base">
                        <QrCode className="w-4 h-4 text-muted-foreground" />
                        Scan to open
                    </DialogTitle>
                </DialogHeader>
                <div className="flex flex-col items-center gap-4 py-2">
                    <div className="p-4 bg-white rounded-xl border border-border">
                        <QRCodeSVG
                            value={url}
                            size={200}
                            bgColor="#ffffff"
                            fgColor="#0f0f0f"
                            level="M"
                        />
                    </div>
                    <p className="text-xs text-muted-foreground font-mono text-center break-all px-2">
                        {clipName}
                    </p>
                </div>
            </DialogContent>
        </Dialog>
    );
};

/* ─────────────────────────────────────────────
   Copy Link Button
───────────────────────────────────────────── */
const CopyLinkButton: React.FC = () => {
    const [copied, setCopied] = useState(false);

    function copyLink() {
        navigator.clipboard.writeText(window.location.href);
        setCopied(true);
        toast.success("Link copied to clipboard");
        setTimeout(() => setCopied(false), 2000);
    }

    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={copyLink}
                        className={`gap-2 transition-all ${copied ? "border-emerald-500/50 text-emerald-400" : ""}`}
                    >
                        {copied ? (
                            <Check className="w-3.5 h-3.5" />
                        ) : (
                            <Link2 className="w-3.5 h-3.5" />
                        )}
                        {copied ? "Copied!" : "Copy Link"}
                    </Button>
                </TooltipTrigger>
                <TooltipContent>Copy shareable link</TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
};

/* ─────────────────────────────────────────────
   Syntax-highlighted content viewer
───────────────────────────────────────────── */
const SyntaxContent: React.FC<{ text: string }> = ({ text }) => {
    const { resolvedTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    useEffect(() => setMounted(true), []);

    const language = useMemo(() => detectLanguage(text), [text]);
    const isDark = !mounted || resolvedTheme === "dark";

    return (
        <div className="flex-1 min-h-0 flex flex-col relative rounded-xl border border-border bg-muted/30 overflow-hidden">
            {/* Language badge */}
            <div className="shrink-0 flex items-center justify-between px-4 py-1.5 border-b border-border/50 bg-muted/50">
                <span className="text-xs font-mono text-muted-foreground">
                    {language}
                </span>
            </div>
            {/* Highlighted code */}
            <div className="flex-1 min-h-0 overflow-auto">
                <SyntaxHighlighter
                    language={language}
                    style={isDark ? atomOneDark : atomOneLight}
                    customStyle={{
                        margin: 0,
                        padding: "1.25rem",
                        background: "transparent",
                        fontSize: "0.8125rem",
                        lineHeight: "1.6",
                        height: "100%",
                        minHeight: "100%",
                    }}
                    wrapLongLines={false}
                >
                    {text}
                </SyntaxHighlighter>
            </div>
        </div>
    );
};

/* ─────────────────────────────────────────────
   URL Redirect View (one-click URL shortener)
   Shown when the entire clip content is a URL
───────────────────────────────────────────── */
const UrlRedirectView: React.FC<{
    url: string;
    clipName: string;
    remainingTime: number;
    expiresAt: string;
    urgency: "critical" | "warning" | "normal";
    urgencyColors: Record<string, string>;
    formatTime: (s: number) => string;
}> = ({ url, clipName }) => {
    const [copied, setCopied] = useState(false);
    const pageUrl = typeof window !== "undefined" ? window.location.href : "";

    function copyUrl() {
        navigator.clipboard.writeText(url);
        setCopied(true);
        toast.success("URL copied");
        setTimeout(() => setCopied(false), 2000);
    }

    return (
        <div className="flex-1 min-h-0 flex flex-col items-center justify-center gap-8 py-4">
            {/* URL card */}
            <div className="w-full max-w-2xl rounded-2xl border border-border bg-card p-8 flex flex-col items-center gap-6 shadow-lg">
                {/* Icon + hostname */}
                <div className="flex flex-col items-center gap-3">
                    <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                        <ExternalLink className="w-7 h-7 text-emerald-400" />
                    </div>
                    <div className="text-center">
                        <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wider font-medium">
                            Redirection Detected
                        </p>
                        <h2 className="text-lg font-bold font-mono text-foreground">
                            {clipName}
                        </h2>
                        <p className="text-sm text-muted-foreground mt-1">
                            redirects to
                        </p>
                    </div>
                </div>

                {/* Full URL display */}
                <div className="w-full rounded-xl border border-border bg-muted/40 px-4 py-3 flex items-center gap-3">
                    <Link2 className="w-4 h-4 text-muted-foreground shrink-0" />
                    <p className="text-sm font-mono text-foreground/80 truncate flex-1">
                        {url}
                    </p>
                </div>

                {/* Action buttons */}
                <div className="flex gap-3 flex-wrap justify-center">
                    <Button
                        asChild
                        className="gap-2 bg-emerald-600 hover:bg-emerald-500 text-white h-11 px-8 text-base font-semibold"
                    >
                        <Link
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            <ExternalLink className="w-4 h-4" />
                            Open Link
                        </Link>
                    </Button>
                    <Button
                        variant="outline"
                        onClick={copyUrl}
                        className={`gap-2 h-11 ${copied ? "border-emerald-500/50 text-emerald-400" : ""}`}
                    >
                        {copied ? (
                            <Check className="w-4 h-4" />
                        ) : (
                            <Copy className="w-4 h-4" />
                        )}
                        {copied ? "Copied!" : "Copy URL"}
                    </Button>
                </div>

                {/* Timer + QR row */}
                <div className="flex items-center gap-4 flex-wrap justify-center">
                    <QRDialog url={pageUrl} clipName={clipName} />
                    <CopyLinkButton />
                </div>
            </div>
        </div>
    );
};

/* ─────────────────────────────────────────────
   Password Gate
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
                        className={`transition-all duration-200 ${wrong ? "border-red-500 ring-1 ring-red-500" : ""}`}
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

    const urlOnly = isOnlyUrl(data.text);
    const hasFiles = uploadedFiles && uploadedFiles.length > 0;
    const pageUrl = typeof window !== "undefined" ? window.location.href : "";

    // URL-only clips get a special redirect page — but only if there are no files.
    // If files are present alongside a URL, show the normal clip view instead.
    if (urlOnly && !hasFiles) {
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
                        <UrlRedirectView
                            url={urlOnly}
                            clipName={clipName}
                            remainingTime={remainingTime}
                            expiresAt={expiresAt}
                            urgency={urgency}
                            urgencyColors={urgencyColors}
                            formatTime={formatTime}
                        />
                    </div>
                </div>
            </div>
        );
    }

    // Normal clip — syntax-highlighted content + optional files sidebar
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
                        {/* Header action buttons */}
                        <div className="flex items-center gap-2 flex-wrap">
                            <CopyLinkButton />
                            <QRDialog url={pageUrl} clipName={clipName} />
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
                    </div>

                    <div className="shrink-0 h-px bg-border" />

                    {/* Grid */}
                    <div
                        className={`flex-1 min-h-0 grid gap-6 ${hasFiles ? "grid-cols-1 lg:grid-cols-3" : "grid-cols-1"}`}
                    >
                        <div
                            className={`flex flex-col min-h-0 gap-3 ${hasFiles ? "lg:col-span-2" : ""}`}
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
                                                            Open Link
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

                            {/* Syntax highlighted content */}
                            {data.text ? (
                                <SyntaxContent text={data.text} />
                            ) : (
                                <div className="flex-1 min-h-0 relative rounded-xl border border-border bg-muted/30 overflow-hidden flex items-center justify-center">
                                    <p className="text-muted-foreground/50 text-sm">
                                        No text content in this clip.
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Files sidebar */}
                        <div className="min-h-0 overflow-y-auto space-y-4 pb-1">
                            {hasFiles && (
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
    const [customExpiryDate, setCustomExpiryDate] = useState<Date | undefined>(
        undefined,
    );

    const form = useForm<z.infer<typeof FormSchema>>({
        resolver: zodResolver(FormSchema),
    });

    useEffect(() => {
        form.setValue("name", clipName);
    }, [clipName, form]);

    const selectedValidity = form.watch("validity");

    async function onClipSubmit(data: z.infer<typeof FormSchema>) {
        if (isCreating) return;
        setIsCreating(true);
        try {
            // For custom expiry, compute seconds from now
            let effectiveValidity = data.validity;
            if (data.validity === "custom") {
                if (!customExpiryDate) {
                    toast.error("Please select a custom expiry date.");
                    return;
                }
                const secondsFromNow = Math.floor(
                    (customExpiryDate.getTime() - Date.now()) / 1000,
                );
                if (secondsFromNow < 60) {
                    toast.error(
                        "Expiry must be at least 1 minute in the future.",
                    );
                    return;
                }
                effectiveValidity = String(secondsFromNow);
            }

            const formData = {
                ...data,
                validity: effectiveValidity,
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
        } finally {
            setIsCreating(false);
        }
    }

    const [loading, setLoading] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
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
        { value: "custom", label: "Custom date & time…" },
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

                                    {/* Validity */}
                                    <FormField
                                        control={form.control}
                                        name="validity"
                                        render={({ field }) => (
                                            <FormItem className="shrink-0">
                                                <FormLabel className="flex items-center gap-2 text-sm font-semibold">
                                                    <Clock className="w-4 h-4 text-muted-foreground" />
                                                    Clip Validity
                                                </FormLabel>
                                                <div className="flex items-start gap-3 flex-wrap">
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
                                                                        {opt.value ===
                                                                        "custom" ? (
                                                                            <span className="flex items-center gap-2">
                                                                                <CalendarIcon className="w-3.5 h-3.5" />
                                                                                {
                                                                                    opt.label
                                                                                }
                                                                            </span>
                                                                        ) : (
                                                                            opt.label
                                                                        )}
                                                                    </SelectItem>
                                                                ),
                                                            )}
                                                        </SelectContent>
                                                    </Select>

                                                    {/* Shadcn DateTimePicker — shown only when "custom" is selected */}
                                                    {selectedValidity ===
                                                        "custom" && (
                                                        <DateTimePicker
                                                            value={
                                                                customExpiryDate
                                                            }
                                                            onChange={
                                                                setCustomExpiryDate
                                                            }
                                                            minDate={addMinutes(
                                                                new Date(),
                                                                1,
                                                            )}
                                                        />
                                                    )}
                                                </div>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    {/* Text */}
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

                                    {/* Create button */}
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
                                                        disabled={isCreating}
                                                    >
                                                        {isCreating ? (
                                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                        ) : (
                                                            <Plus className="w-4 h-4 mr-2" />
                                                        )}
                                                        {isCreating
                                                            ? "Creating…"
                                                            : "Create Clip"}
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
                                        Paste a URL to use as a link shortener.
                                    </li>
                                    <li className="flex gap-2">
                                        <span className="text-emerald-400 mt-0.5">
                                            ✦
                                        </span>
                                        Code is syntax-highlighted
                                        automatically.
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
