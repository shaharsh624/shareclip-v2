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
        e.preventDefault();
        if (clipName) {
            window.location.href = `/${clipName}`;
        }
    };

    return (
        <div className="flex flex-col h-screen">
            <Navbar />
            <main className="flex-1 flex flex-col justify-center items-center px-4">
                <section className="w-full">
                    <div className="flex flex-col items-center text-center space-y-4">
                        <h1 className="text-4xl font-bold sm:text-5xl md:text-6xl">
                            Share Text and Files on Internet
                        </h1>
                        <p className="max-w-[90%] text-gray-500 md:text-xl dark:text-gray-400">
                            Create temporary clips with custom URLs. Perfect for
                            sharing information or files online.
                        </p>
                        <form
                            className="flex flex-col md:flex-row space-y-5 md:space-y-0 md:space-x-2 items-center justify-center w-full max-w-md"
                            onSubmit={handleSubmit}
                        >
                            <Input
                                className=""
                                placeholder="Enter a personalized clip name"
                                type="text"
                                value={clipName}
                                onChange={(e) => setClipName(e.target.value)}
                            />
                            <Button type="submit" className="md:w-auto">
                                Visit
                                <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                        </form>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                            Start sharing for free. No signup needed.
                        </p>
                    </div>
                </section>
            </main>
            <footer className="flex gap-2 sm:flex-row py-4 w-full items-center px-4 border-t">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                    © 2024 Harsh Shah. All rights reserved.
                </p>
                <nav className="ml-auto flex gap-4">
                    <Link
                        className="text-xs hover:underline"
                        href="https://www.linkedin.com/in/harshshahdev"
                        target="_blank"
                    >
                        <Icons.linkedin className="size-4" />
                    </Link>
                    <Link
                        className="text-xs hover:underline"
                        href="https://github.com/shaharsh624"
                        target="_blank"
                    >
                        <Icons.github className="size-4" />
                    </Link>
                    <Link
                        className="text-xs hover:underline"
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
