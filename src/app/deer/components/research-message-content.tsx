// Copyright (c) 2025 Bytedance Ltd. and/or its affiliates
// SPDX-License-Identifier: MIT

"use client";

import React, { useMemo } from "react";
import type { Message } from "~/core/messages";
import { parseJSON } from "~/core/utils";
import { Markdown } from "~/components/deer-flow/markdown";

interface ResearchMessageContentProps {
  message: Message;
}

export function ResearchMessageContent({ message }: ResearchMessageContentProps) {
  const contentData = useMemo(() => {
    // Attempt to parse the message content as JSON
    try {
      // Provide a default value for parseJSON
      return parseJSON(message.content, {});
    } catch (error) {
      console.error("Failed to parse research message content:", error);
      // Return original content if parsing fails
      return message.content;
    }
  }, [message.content]);

  // Basic rendering logic - will be expanded
  if (typeof contentData === 'object' && contentData !== null) {
    // Assuming the JSON structure for a research plan or step
    const { title, thought, steps } = contentData as any; // Use 'any' for now, refine later

    return (
      <div className="flex flex-col space-y-2">
        {title && <h4 className="text-md font-semibold"><Markdown>{title}</Markdown></h4>}
        {thought && <p className="text-sm opacity-80"><Markdown>{thought}</Markdown></p>}
        {steps && Array.isArray(steps) && (
          <ul className="my-2 flex list-decimal flex-col gap-2 border-l-[2px] pl-8">
            {steps.map((step: any, index: number) => (
              <li key={index}>
                 {step.title && <h5 className="text-sm font-medium"><Markdown>{step.title}</Markdown></h5>}
                 {step.description && <p className="text-xs text-muted-foreground"><Markdown>{step.description}</Markdown></p>}
              </li>
            ))}
          </ul>
        )}
        {/* Add more rendering logic based on other possible JSON structures */}
      </div>
    );
  } else {
    // Render as plain text if not an object (e.g., initial user message, or error)
    return <div className="text-sm"><Markdown>{String(contentData)}</Markdown></div>;
  }
} 