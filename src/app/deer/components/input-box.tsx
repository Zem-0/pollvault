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
    <form onSubmit={handleSubmit} className={cn("flex gap-2", className)}>
      <Input
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Type your message..."
        disabled={disabled}
        className="flex-1"
      />
      <Button type="submit" disabled={disabled || !message.trim()}>
        Send
      </Button>
    </form>
  );
}
