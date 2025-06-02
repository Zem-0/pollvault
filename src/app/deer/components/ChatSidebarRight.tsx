// Copyright (c) 2025 Bytedance Ltd. and/or its affiliates
// SPDX-License-Identifier: MIT

"use client";

import { SearchOutlined, EllipsisOutlined } from "@ant-design/icons";
import { Button } from "~/components/ui/button";

export default function ChatSidebarRight() {
  return (
    <aside className="w-80 border-l border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 p-4 overflow-y-auto shrink-0">
      {/* Saved Responses Section */}
      <section>
        <div className="flex items-center border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 mb-4 focus-within:border-blue-500 dark:focus-within:border-blue-600">
          <SearchOutlined className="text-gray-500 dark:text-gray-400 mr-2 text-base" />
          <input
            type="text"
            placeholder="Search for saved responses"
            className="flex-grow bg-transparent outline-none text-gray-800 dark:text-gray-200 placeholder-gray-500 dark:placeholder-gray-400 text-sm py-1"
          />
        </div>

        {/* Placeholder saved responses list */}
        <ul>
          <li className="border border-gray-200 dark:border-gray-700 rounded-md p-3 mb-2 bg-white dark:bg-gray-800 shadow-sm cursor-pointer hover:border-blue-500 dark:hover:border-blue-600 overflow-hidden flex flex-col flex min-w-0">
            <div className="flex justify-between items-center mb-1">
              <h3 className="font-semibold text-gray-800 dark:text-gray-200 text-sm truncate flex-1 min-w-0">CEO strengths in vision</h3>
               <Button variant="ghost" size="icon" className="w-6 h-6 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"><EllipsisOutlined className="text-base"/></Button>
            </div>
            <p className="text-gray-700 dark:text-gray-300 text-sm line-clamp-2">Your approach to decision-making is viewed as a significant strength...</p>
          </li>
           <li className="border border-gray-200 dark:border-gray-700 rounded-md p-3 mb-2 bg-white dark:bg-gray-800 shadow-sm cursor-pointer hover:border-blue-500 dark:hover:border-blue-600 overflow-hidden flex flex-col flex min-w-0">
            <div className="flex justify-between items-center mb-1">
              <h3 className="font-semibold text-gray-800 dark:text-gray-200 text-sm truncate flex-1 min-w-0">CEO strengths in vision</h3>
               <Button variant="ghost" size="icon" className="w-6 h-6 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"><EllipsisOutlined className="text-base"/></Button>
            </div>
            <p className="text-gray-700 dark:text-gray-300 text-sm line-clamp-2">The CEO is lauded by his peers for his vision, even as DC office feels discon...</p>
          </li>
        </ul>

         {/* Placeholder bookmark input */}
         <div className="border border-gray-200 dark:border-gray-700 rounded-md p-3 mt-4 bg-white dark:bg-gray-800 shadow-sm overflow-hidden flex flex-col">
            <h3 className="font-semibold text-gray-800 dark:text-gray-200 text-sm mb-2 truncate flex-1 min-w-0">Enter bookmark title</h3>
             <p className="text-gray-700 dark:text-gray-300 text-sm mb-3 line-clamp-2">The CEO is lauded by his peers for his vision, even as DC office feels discon...</p>
             <div className="flex justify-end">
               <Button variant="outline" size="sm">Save</Button>
             </div>
         </div>
      </section>
    </aside>
  );
} 