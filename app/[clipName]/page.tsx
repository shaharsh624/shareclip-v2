"use client";

import React, { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { createClip } from "@/lib/action";

import { toast } from "sonner";
import { Button } from "@/components/ui/button";
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
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";

const FormSchema = z.object({
    name: z.string(),
    validity: z.string().nonempty("Please select the validity"),
    text: z.string().optional(),
});

const ClipPage = () => {
    const pathname = usePathname();
    const [clipName] = useState(pathname.replace("/", ""));

    const form = useForm<z.infer<typeof FormSchema>>({
        resolver: zodResolver(FormSchema),
    });

    // Set the default value for the hidden field when the component mounts
    useEffect(() => {
        form.setValue("name", clipName);
    }, [clipName, form]);

    async function onSubmit(data: z.infer<typeof FormSchema>) {
        console.log(data);
        await createClip(data);
        toast(JSON.stringify(data, null, 2));
    }

    return (
        <div className="px-20 py-10">
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)}>
                    <div className="flex justify-between">
                        <h1 className="font-bold text-3xl">{clipName}</h1>
                        <Button type="submit">Create</Button>
                    </div>

                    <div className="flex gap-5">
                        <div className="w-4/5 pt-1 space-y-5">
                            <FormField
                                control={form.control}
                                name="name"
                                render={() => (
                                    <FormItem>
                                        <FormControl>
                                            <Input
                                                style={{ display: "none" }}
                                                defaultValue={clipName}
                                            />
                                        </FormControl>
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="validity"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-lg">
                                            Validity
                                        </FormLabel>
                                        <Select
                                            onValueChange={field.onChange}
                                            value={field.value} // Bind the value here
                                        >
                                            <FormControl>
                                                <SelectTrigger className="w-[180px]">
                                                    <SelectValue placeholder="Select Validity" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="60">
                                                    1 Minute
                                                </SelectItem>
                                                <SelectItem value="300">
                                                    5 Minutes
                                                </SelectItem>
                                                <SelectItem value="600">
                                                    10 Minutes
                                                </SelectItem>
                                                <SelectItem value="3600">
                                                    1 Hour
                                                </SelectItem>
                                                <SelectItem value="86400">
                                                    1 Day
                                                </SelectItem>
                                                <SelectItem value="604800">
                                                    1 Week
                                                </SelectItem>
                                                <SelectItem value="2592000">
                                                    1 Month
                                                </SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="text"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-lg">
                                            Text
                                        </FormLabel>
                                        <FormControl>
                                            <Textarea
                                                placeholder="Write some text to share"
                                                className="resize-none"
                                                rows={20}
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                        <div className="w-1/5 py-6">
                            <p className="text-lg">Files</p>
                        </div>
                    </div>
                </form>
            </Form>
        </div>
    );
};

export default ClipPage;
