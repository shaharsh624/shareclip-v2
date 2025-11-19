"use client";
import { motion } from "framer-motion";
import { ArrowRight, Circle, IconNode } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import Link from "next/link";
import { IconProps, Icons } from "@/components/icons";
type ElegantShapeProps = {
    className?: string;
    delay?: number;
    width?: number;
    height?: number;
    rotate?: number;
    gradient?: string;
};
function ElegantShape({
    className,
    delay = 0,
    width = 400,
    height = 100,
    rotate = 0,
    gradient = "from-white/[0.08]",
}: ElegantShapeProps) {
    return (
        <motion.div
            initial={{
                opacity: 0,
                y: -150,
                rotate: rotate - 15,
            }}
            animate={{
                opacity: 1,
                y: 0,
                rotate: rotate,
            }}
            transition={{
                duration: 2.4,
                delay,
                ease: [0.23, 0.86, 0.39, 0.96],
                opacity: { duration: 1.2 },
            }}
            className={`absolute${className ? ` ${className}` : ""}`}
        >
            <motion.div
                animate={{
                    y: [0, 15, 0],
                }}
                transition={{
                    duration: 12,
                    repeat: Number.POSITIVE_INFINITY,
                    ease: "easeInOut",
                }}
                style={{
                    width,
                    height,
                }}
                className="relative"
            >
                <div
                    className={cn(
                        "absolute inset-0 rounded-full",
                        "bg-gradient-to-r to-transparent",
                        gradient,
                        "backdrop-blur-[2px] border-2 border-white/[0.15]",
                        "shadow-[0_8px_32px_0_rgba(255,255,255,0.1)]",
                        "after:absolute after:inset-0 after:rounded-full",
                        "after:bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.2),transparent_70%)]"
                    )}
                />
            </motion.div>
        </motion.div>
    );
}
type BadgeProp = {
    name: string;
    url: string;
    icon: React.ReactNode;
};

type HeroGeometricProps = {
    badges?: BadgeProp[];
    title1?: string;
    title2?: string;
    title3?: string;
    description?: string;
    className?: string;
};
export default function Home({
    badges = [
        {
            name: "harshshahdev",
            url: "https://www.linkedin.com/in/harshshahdev",
            icon: <Icons.linkedin className="size-4" />,
        },
        {
            name: "shaharsh624",
            url: "https://github.com/shaharsh624",
            icon: <Icons.github className="size-4" />,
        },
        {
            name: "_shaharshhh",
            url: "https://x.com/_shaharshhh",
            icon: <Icons.x className="size-4" />,
        },
    ],
    title1 = "Share Unlimited",
    title2 = "Text and Files on",
    title3 = "Shareclip",
    description = "Create temporary clips with custom URLs. Perfect for sharing information or files online.",
    className,
}: HeroGeometricProps) {
    const fadeUpVariants = {
        hidden: { opacity: 0, y: 30 },
        visible: (i: number) => ({
            opacity: 1,
            y: 0,
            transition: {
                duration: 1,
                delay: 0.5 + i * 0.2,
                ease: [0.25, 0.4, 0.25, 1] as const,
            },
        }),
    };

    const [clipName, setClipName] = useState("");
    const [error, setError] = useState("");

    const handleSubmit = (e: { preventDefault: () => void }) => {
        e.preventDefault();
        if (clipName) {
            setError("");
            window.location.href = `/${clipName}`;
        } else {
            setError("Please enter a clip name.");
        }
    };

    return (
        <div
            className={cn(
                "relative min-h-screen w-full flex items-center justify-center overflow-hidden bg-[#030303]",
                className
            )}
        >
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/[0.05] via-transparent to-rose-500/[0.05] blur-3xl" />
            <div className="absolute inset-0 overflow-hidden">
                <ElegantShape
                    delay={0.3}
                    width={600}
                    height={140}
                    rotate={12}
                    gradient="from-indigo-500/[0.15]"
                    className="left-[-10%] md:left-[-5%] top-[15%] md:top-[20%]"
                />
                <ElegantShape
                    delay={0.5}
                    width={500}
                    height={120}
                    rotate={-15}
                    gradient="from-rose-500/[0.15]"
                    className="right-[-5%] md:right-[0%] top-[70%] md:top-[75%]"
                />
                <ElegantShape
                    delay={0.4}
                    width={300}
                    height={80}
                    rotate={-8}
                    gradient="from-violet-500/[0.15]"
                    className="left-[5%] md:left-[10%] bottom-[5%] md:bottom-[10%]"
                />
                <ElegantShape
                    delay={0.6}
                    width={200}
                    height={60}
                    rotate={20}
                    gradient="from-amber-500/[0.15]"
                    className="right-[15%] md:right-[20%] top-[10%] md:top-[15%]"
                />
                <ElegantShape
                    delay={0.7}
                    width={150}
                    height={40}
                    rotate={-25}
                    gradient="from-cyan-500/[0.15]"
                    className="left-[20%] md:left-[25%] top-[5%] md:top-[10%]"
                />
            </div>
            <div className="relative z-10 container mx-auto px-4 md:px-6">
                <div className="max-w-3xl mx-auto text-center">
                    <div className="hidden sm:block flex gap-3 justify-center">
                        {badges.map((badge) => (
                            <Link href={badge.url} target="_blank">
                                <motion.div
                                    custom={0}
                                    variants={fadeUpVariants}
                                    initial="hidden"
                                    animate="visible"
                                    className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.03] border border-white/[0.1] mb-8 md:mb-12  hover:underline hover:cursor-pointer"
                                >
                                    {badge.icon}
                                    <span className="text-sm text-white/60 tracking-wide">
                                        {badge.name}
                                    </span>
                                </motion.div>
                            </Link>
                        ))}
                    </div>
                    <div>
                        <motion.div
                            custom={1}
                            variants={fadeUpVariants}
                            initial="hidden"
                            animate="visible"
                        >
                            <h1 className="text-4xl sm:text-6xl md:text-8xl font-bold mb-6 md:mb-8 tracking-tight">
                                <span className="bg-clip-text text-transparent bg-gradient-to-b from-white to-white/60">
                                    {title1}
                                </span>
                                <br />
                                <span
                                    className={cn(
                                        "bg-clip-text text-transparent bg-gradient-to-r from-indigo-300 via-white/90 to-rose-300"
                                    )}
                                >
                                    {title2}
                                </span>
                                <br />
                                <span
                                    className={cn(
                                        "flex justify-center bg-clip-text text-transparent bg-gradient-to-b from-emerald-500 to-lime-300"
                                    )}
                                >
                                    {title3}
                                </span>
                            </h1>
                        </motion.div>
                        <motion.div
                            custom={2}
                            variants={fadeUpVariants}
                            initial="hidden"
                            animate="visible"
                        >
                            <p className="text-base sm:text-lg md:text-xl text-gray-500 dark:text-gray-400 mb-8 leading-relaxed font-light tracking-wide max-w-xl mx-auto px-16">
                                {description}
                            </p>
                        </motion.div>
                    </div>
                    <div className="flex flex-col items-center mx-auto text-center">
                        <motion.div
                            custom={2}
                            variants={fadeUpVariants}
                            initial="hidden"
                            animate="visible"
                        >
                            <form
                                className="flex flex-col md:flex-row space-y-5 md:space-y-0 md:space-x-2 items-center justify-center w-full max-w-md"
                                onSubmit={handleSubmit}
                            >
                                <Input
                                    className="border-gray-600"
                                    placeholder="Enter a personalised clip"
                                    type="text"
                                    value={clipName}
                                    onChange={(e) => {
                                        setClipName(e.target.value);
                                        if (error) setError("");
                                    }}
                                />

                                <Button
                                    type="submit"
                                    variant="secondary"
                                    className="md:w-auto"
                                >
                                    Visit
                                    <ArrowRight className="ml-2 h-4 w-4" />
                                </Button>
                            </form>
                            {error && (
                                <span className="text-red-500 text-sm mt-2">
                                    {error}
                                </span>
                            )}
                        </motion.div>
                        <motion.div
                            custom={2}
                            variants={fadeUpVariants}
                            initial="hidden"
                            animate="visible"
                            className="mt-10"
                        >
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                Start sharing for free. No signup needed.
                            </p>
                        </motion.div>
                    </div>
                </div>
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-[#030303] via-transparent to-[#030303]/80 pointer-events-none" />
        </div>
    );
}
export type { HeroGeometricProps, ElegantShapeProps };
