import Link from "next/link";
import React from "react";
import { ModeToggle } from "./mode-toggle";
import Image from "next/image";

const Navbar = () => {
    return (
        <header className="sticky top-0 z-50 px-4 lg:px-10 h-14 flex items-center w-full border-b border-border/50 bg-background/80 backdrop-blur-md">
            <Link className="flex items-center gap-2 group" href="/">
                <Image
                    src="/logo-2.svg"
                    alt="Shareclip"
                    width="22"
                    height="20"
                    className="opacity-90 group-hover:opacity-100 transition-opacity"
                />
                <span className="text-xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70">
                    Shareclip
                </span>
            </Link>
            <nav className="ml-auto flex gap-4 sm:gap-6 items-center">
                <ModeToggle />
            </nav>
        </header>
    );
};

export default Navbar;
