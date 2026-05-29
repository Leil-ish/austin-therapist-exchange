"use client";

import { useFormStatus } from "react-dom";

import { Button } from "./button";
import type { ComponentProps } from "react";

type ButtonProps = ComponentProps<typeof Button>;

interface SubmitButtonProps extends Omit<ButtonProps, "type"> {
  pendingLabel?: string;
}

export function SubmitButton({ children, pendingLabel, disabled, ...props }: SubmitButtonProps) {
  const { pending } = useFormStatus();
  return (
    <Button {...props} aria-busy={pending} disabled={disabled ?? pending} type="submit">
      {pending ? (pendingLabel ?? "Saving…") : children}
    </Button>
  );
}
