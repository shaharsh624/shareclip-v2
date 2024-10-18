import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { connectToMongoDB } from "@/lib/db";

const geistSans = localFont({
    src: "./fonts/GeistVF.woff",
    variable: "--font-geist-sans",
    weight: "100 900",
});

export const metadata: Metadata = {
    title: "Shareclip",
    description: "A Secure Temporary Sharing App",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    connectToMongoDB();
    return (
        <html lang="en" suppressHydrationWarning={true}>
            <body
                className={`${geistSans.variable} antialiased font-[family-name:var(--font-geist-sans)]`}
            >
                <ThemeProvider
                    attribute="class"
                    defaultTheme="dark"
                    enableSystem
                    disableTransitionOnChange
                >
                    {children}
                    <Toaster />
                </ThemeProvider>
            </body>
        </html>
    );
}
