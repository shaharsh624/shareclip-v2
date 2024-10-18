"use client";

import * as React from "react";
import { MoonIcon, SunIcon } from "@radix-ui/react-icons";
import { useTheme } from "next-themes";

import { Button } from "@/components/ui/button";

export function ModeToggle() {
    const { theme, setTheme } = useTheme();

    const toggleTheme = () => {
        setTheme(theme === "dark" ? "light" : "dark");
    };

    return (
        <Button variant="outline" size="icon" onClick={toggleTheme}>
            {theme === "dark" ? (
                <MoonIcon className="absolute h-[1.2rem] w-[1.2rem] transition-all dark:rotate-0 dark:scale-100" />
            ) : (
                <SunIcon className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all" />
            )}
            <span className="sr-only">Toggle theme</span>
        </Button>
    );
}
