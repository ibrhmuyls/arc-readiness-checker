"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import { isArcAddress, ADDRESS_ERROR_MESSAGE } from "@/lib/validation";

export function WalletInput({
  value,
  onChange,
  disabled,
}: {
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
}) {
  const [touched, setTouched] = React.useState(false);
  const showError = touched && value.length > 0 && !isArcAddress(value);

  return (
    <div className="w-full">
      <Input
        inputMode="text"
        autoComplete="off"
        spellCheck={false}
        placeholder="0x… (EVM wallet address)"
        aria-label="Wallet address"
        aria-invalid={showError}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value.trim())}
        onBlur={() => setTouched(true)}
        className="font-mono"
      />
      {showError && (
        <p className="mt-2 text-sm text-red-400">{ADDRESS_ERROR_MESSAGE}</p>
      )}
    </div>
  );
}
