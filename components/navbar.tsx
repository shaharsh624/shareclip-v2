import Link from "next/link";
import React from "react";
import { ModeToggle } from "./mode-toggle";
import Image from "next/image";

const Navbar = () => {
    return (
        <header className="px-4 lg:px-10 h-14 flex items-center w-full pt-5">
            <Link className="flex items-center" href="/">
                <Image
                    src="/logo-2.svg"
                    alt="Shareclip"
                    width="24"
                    height="22"
                />
                <span className="ml-1 text-2xl font-bold">Shareclip</span>
            </Link>
            <nav className="ml-auto flex gap-4 sm:gap-6">
                <ModeToggle />
            </nav>
        </header>
    );
};

export default Navbar;
