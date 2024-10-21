"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowRight } from "lucide-react";
import { Icons } from "@/components/icons";
import Navbar from "@/components/navbar";

export default function Home() {
    const [clipName, setClipName] = useState("");

    const handleSubmit = (e: { preventDefault: () => void }) => {
        e.preventDefault(); // Prevent the default form submission
        if (clipName) {
            window.location.href = `/${clipName}`; // Redirect to the desired URL
        }
    };

    return (
        <div className="flex flex-col min-h-screen">
            <Navbar />
            <main className="flex-1">
                <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48">
                    <div className="container mx-auto px-4 md:px-6">
                        <div className="flex flex-col items-center space-y-4 text-center">
                            <div className="space-y-4">
                                <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl">
                                    Share Text and Files on Internet
                                </h1>
                                <p className="mx-auto max-w-[90%] md:max-w-[550px] text-gray-500 md:text-xl dark:text-gray-400">
                                    Create temporary clips with custom URLs.
                                    Perfect for sharing information or files
                                    online.
                                </p>
                            </div>
                            <div className="w-full max-w-sm space-y-4">
                                <form
                                    className="flex flex-col md:flex-row space-y-5 md:space-y-0 md:space-x-2 items-center justify-center"
                                    onSubmit={handleSubmit}
                                >
                                    <Input
                                        className="max-w-xs flex-1"
                                        placeholder="Enter a personalized clip name"
                                        type="text"
                                        value={clipName}
                                        onChange={(e) =>
                                            setClipName(e.target.value)
                                        }
                                    />
                                    <Button
                                        type="submit"
                                        className="max-w-xs md:w-auto"
                                    >
                                        Visit
                                        <ArrowRight className="ml-2 h-4 w-4" />
                                    </Button>
                                </form>
                                <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                                    Start sharing for free. No signup needed.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>
            </main>
            <footer className="flex flex-col gap-2 sm:flex-row py-6 w-full shrink-0 items-center px-4 md:px-6 border-t">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                    © 2024 Harsh Shah. All rights reserved.
                </p>
                <nav className="sm:ml-auto flex gap-4 sm:gap-5">
                    <Link
                        className="text-xs hover:underline underline-offset-4"
                        href="https://github.com/shaharsh624"
                        target="_blank"
                    >
                        <Icons.github className="size-4" />
                    </Link>
                    <Link
                        className="text-xs hover:underline underline-offset-4"
                        href="https://www.linkedin.com/in/harshshahdev"
                        target="_blank"
                    >
                        <Icons.linkedin className="size-4" />
                    </Link>
                    <Link
                        className="text-xs hover:underline underline-offset-4"
                        href="https://twitter.com/_shaharshhh"
                        target="_blank"
                    >
                        <Icons.x className="size-4" />
                    </Link>
                </nav>
            </footer>
        </div>
    );
}
