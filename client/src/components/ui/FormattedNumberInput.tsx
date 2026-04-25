"use client";

import { useEffect, useState } from "react";
import { Input } from "./Input";
import { formatDecimalInr, normalizeDecimalInput, parseDecimalString } from "@/lib/formNumbers";

type Props = {
  value: number | undefined;
  onChange: (n: number | undefined) => void;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
};

/**
 * Decimal input with `en-IN` grouping on blur. Parses on each change so the parent
 * value stays in sync before submit without requiring a blur first.
 */
export function FormattedNumberInput({
  value,
  onChange,
  disabled,
  placeholder,
  className,
}: Props) {
  const [text, setText] = useState("");

  useEffect(() => {
    if (value === undefined || value === null || Number.isNaN(value)) {
      setText("");
    } else {
      setText(formatDecimalInr(value));
    }
  }, [value]);

  const pushParsed = (raw: string) => {
    const normalized = normalizeDecimalInput(raw);
    if (normalized === "" || normalized === ".") {
      onChange(undefined);
      return;
    }
    const n = parseDecimalString(normalized);
    if (n != null) onChange(n);
  };

  return (
    <Input
      disabled={disabled}
      inputMode="decimal"
      className={className}
      placeholder={placeholder}
      value={text}
      onChange={(e) => {
        const raw = e.target.value;
        setText(raw);
        pushParsed(raw);
      }}
      onBlur={() => {
        const normalized = normalizeDecimalInput(text);
        if (normalized === "" || normalized === ".") {
          setText("");
          return;
        }
        const n = parseDecimalString(normalized);
        if (n != null) {
          onChange(n);
          setText(formatDecimalInr(n));
        }
      }}
    />
  );
}
