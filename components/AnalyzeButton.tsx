"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { isArcAddress } from "@/lib/validation";
import { Loader2 } from "lucide-react";

export function AnalyzeButton({
  address,
  onClick,
  loading,
}: {
  address: string;
  onClick: () => void;
  loading: boolean;
}) {
  const valid = isArcAddress(address);
  return (
    <Button
      size="lg"
      onClick={onClick}
      disabled={!valid || loading}
      className="w-full sm:w-auto"
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
      {loading ? "Analyzing…" : "Analyze"}
    </Button>
  );
}
