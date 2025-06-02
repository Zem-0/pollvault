// Copyright (c) 2025 Bytedance Ltd. and/or its affiliates
// SPDX-License-Identifier: MIT

"use client";

import { EditOutlined, UploadOutlined } from "@ant-design/icons";
import { Button } from "~/components/ui/button";

export default function ChatSidebarLeft() {
  return (
    <aside className="w-64 border-r border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 p-4 overflow-y-auto shrink-0">
      {/* Conversations Section */}
      <section className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-200">Conversations</h2>
          <Button variant="ghost" size="icon" className="w-6 h-6 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"><EditOutlined /></Button>
        </div>
        {/* Placeholder conversation list */}
        <ul>
          <li className="text-gray-700 dark:text-gray-300 py-1.5 px-2 text-sm cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 rounded truncate w-full overflow-hidden flex min-w-0">Untitled (tap to edit)</li>
          <li className="text-gray-700 dark:text-gray-300 py-1.5 px-2 text-sm cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 rounded truncate w-full overflow-hidden flex min-w-0">Strengths of Aaron</li>
          <li className="text-gray-700 dark:text-gray-300 py-1.5 px-2 text-sm cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 rounded truncate w-full overflow-hidden flex min-w-0">Areas of Improvement of Aar...</li>
          <li className="text-gray-700 dark:text-gray-300 py-1.5 px-2 text-sm cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 rounded truncate w-full overflow-hidden flex min-w-0">Areas of improvement of Jake</li>
          <li className="text-gray-700 dark:text-gray-300 py-1.5 px-2 text-sm cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 rounded truncate w-full overflow-hidden flex min-w-0">Strengths of Jake</li>
        </ul>
      </section>

      {/* Knowledge Section */}
      <section>
         <div className="flex items-center justify-between mb-3">
           <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-200">Knowledge</h2>
           <Button variant="ghost" size="icon" className="w-6 h-6 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"><UploadOutlined /></Button>
         </div>
         {/* Placeholder knowledge items */}
         <ul>
           <li className="text-gray-700 dark:text-gray-300 py-1.5 px-2 text-sm cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 rounded truncate w-full overflow-hidden flex min-w-0">1. Select primary files for analysis</li>
            <li className="text-gray-700 dark:text-gray-300 py-1.5 px-2 text-sm cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 rounded truncate w-full overflow-hidden flex min-w-0">Feedback +2</li>
             <li className="text-gray-700 dark:text-gray-300 py-1.5 px-2 text-sm cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 rounded truncate w-full overflow-hidden flex min-w-0">2. Select files with context</li>
             <li className="text-gray-700 dark:text-gray-300 py-1.5 px-2 text-sm cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 rounded truncate w-full overflow-hidden flex min-w-0">Org chart, Instruments</li>
              <li className="text-gray-700 dark:text-gray-300 py-1.5 px-2 text-sm cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 rounded truncate w-full overflow-hidden flex min-w-0">3. Select any files as reference</li>
              <li className="text-gray-700 dark:text-gray-300 py-1.5 px-2 text-sm cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 rounded truncate w-full overflow-hidden flex min-w-0">Example report</li>
              <li className="text-gray-700 dark:text-gray-300 py-1.5 px-2 text-sm cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 rounded truncate w-full overflow-hidden flex min-w-0">4. Add any additional context / reasoning for the conversation</li>
         </ul>
         {/* Placeholder instructions */}
         <div className="text-xs text-gray-500 dark:text-gray-400 mt-3 leading-relaxed">
            Instructions on how you want the AI to respond for this survey, what are you looking for, specific dos and don'ts, your step-by-step process (if needed), etc.
         </div>
      </section>
    </aside>
  );
} 