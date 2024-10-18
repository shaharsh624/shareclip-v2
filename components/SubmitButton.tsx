import React from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";

export default function SubmitButton() {
    const { pending } = useFormStatus();
    return (
        <Button type="submit" {...(pending && { disabled: true })}>
            {pending ? "Creating..." : "Create"}
        </Button>
    );
}
