import { Clipboard } from "lucide-react";
import Link from "next/link";
import React from "react";
import { ModeToggle } from "./mode-toggle";

const Navbar = () => {
    return (
        <header className="px-4 lg:px-6 h-14 flex items-center w-full">
            <Link className="flex items-center" href="/">
                <Clipboard className="h-6 w-6" />
                <span className="ml-2 text-2xl font-bold">Shareclip</span>
            </Link>
            <nav className="ml-auto flex gap-4 sm:gap-6">
                <ModeToggle />
            </nav>
        </header>
    );
};

export default Navbar;
