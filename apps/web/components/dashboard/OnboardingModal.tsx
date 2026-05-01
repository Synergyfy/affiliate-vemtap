"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";

export default function OnboardingModal() {
  const [isOpen, setIsOpen] = useState(true);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-lg">
        <h2 className="mb-4 text-xl font-bold">Welcome!</h2>
        <p className="mb-4 text-gray-600">
          Complete your profile to get started.
        </p>
        <div className="flex justify-end gap-2">
          <Button onClick={() => setIsOpen(false)}>Close</Button>
        </div>
      </div>
    </div>
  );
}
