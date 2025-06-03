// Copyright (c) 2025 Bytedance Ltd. and/or its affiliates
// SPDX-License-Identifier: MIT

"use client";

import { useState } from "react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { sendMessage } from "~/core/store";
import { cn } from "~/lib/utils";
import type { Option } from "~/core/messages";

interface InputBoxProps {
  disabled?: boolean;
  className?: string;
  responding?: boolean;
  feedback?: { option: Option } | null;
  onSend?: (message: string, options?: { interruptFeedback?: string }) => Promise<void>;
  onCancel?: () => void;
  onRemoveFeedback?: () => void;
}

export function InputBox({ disabled, className, responding, feedback, onSend, onCancel, onRemoveFeedback }: InputBoxProps) {
  const [message, setMessage] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && !disabled) {
      if (onSend) {
        onSend(message.trim());
      } else {
        sendMessage(message.trim());
      }
      setMessage("");
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={cn(
        "flex items-center gap-2 rounded-full border border-gray-300 px-4 py-2 shadow-sm",
        className
      )}
    >
      <Input
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Ask me something"
        disabled={disabled}
        className="flex-1 border-none focus-visible:ring-0 shadow-none"
      />
      <div className="text-purple-600">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="lucide lucide-filter"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>
      </div>
    </form>
  );
}
