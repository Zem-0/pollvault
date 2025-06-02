// Copyright (c) 2025 Bytedance Ltd. and/or its affiliates
// SPDX-License-Identifier: MIT

"use client";

import { useStore } from "~/core/store";
import { cn } from "~/lib/utils";
import type { Message } from "~/core/messages";
import React from "react";
import { ScrollArea } from "~/components/ui/scroll-area";
import { ResearchMessageContent } from "./research-message-content";

interface ResearchBlockProps {
  className?: string;
  researchId?: string;
}

export function ResearchBlock({ className, researchId }: ResearchBlockProps) {
  const research = useStore((state) => state.research);

  if (!research || research.id !== researchId) {
    return null;
  }

  // Filter out the planner message from the research results
  const researchActivityMessages = research.messages.filter(
    (message) => message.agent !== "planner"
  );

  return (
    <div className={cn("flex flex-col space-y-4", className)}>
      <div className="rounded-lg border border-gray-200 p-4">
        <h3 className="mb-2 text-lg font-semibold">Research Results</h3>
        <ScrollArea className="h-full">
          <div className="space-y-2">
            {/* Map over the filtered research activity messages */}
            {researchActivityMessages.map((message: Message) => (
              <ResearchMessageContent key={message.id} message={message} />
            ))}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
