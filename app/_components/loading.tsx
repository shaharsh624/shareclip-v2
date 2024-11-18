"use client";

import logo from "../../public/logo-2.svg";
import Image from "next/image";

export default function LoadingPage() {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground">
            <div className="text-center space-y-8 w-full max-w-md px-4">
                <div className="flex items-center justify-center mb-8">
                    <Image
                        src={logo}
                        alt="Shareclip Logo"
                        className="h-12 w-12"
                    />
                    <span className="ml-1 text-4xl font-bold">Shareclip</span>
                </div>

                <p className="text-lg text-muted-foreground">
                    Loading your clip...
                </p>
                <div className="animate-bounce">
                    <svg
                        className="w-6 h-6 text-primary mx-auto"
                        fill="none"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path d="M19 14l-7 7m0 0l-7-7m7 7V3"></path>
                    </svg>
                </div>
            </div>
        </div>
    );
}
