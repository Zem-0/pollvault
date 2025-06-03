"use client";

import { useState } from "react";
import { ChevronUp, ChevronDown, Edit, Upload, ChevronRight } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "~/components/ui/collapsible";

export default function Sidebar() {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <Collapsible
      open={isOpen}
      onOpenChange={setIsOpen}
      className={`relative h-full border-r border-gray-200 dark:border-gray-800 transition-all duration-300 ${isOpen ? 'w-64' : 'w-12'}`}
    >
      <div className="flex h-full flex-col overflow-hidden">
        <div className={`flex items-center px-4 py-3 border-b border-gray-200 dark:border-gray-800 ${isOpen ? 'justify-between' : 'justify-center'}`}>
          {isOpen && <h2 className="text-lg font-semibold">Conversations</h2>}
          {isOpen && <Edit className="h-4 w-4 text-gray-500" />}
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="icon" className={`ml-auto ${!isOpen && 'mx-auto'}`}>
              {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </Button>
          </CollapsibleTrigger>
        </div>
        <CollapsibleContent className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar">
          {isOpen && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold">Knowledge</h3>
                <Upload className="h-4 w-4 text-gray-500" />
              </div>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-700 mb-1">1. Select primary files for analysis</p>
                  <div className="border rounded-md p-2 text-gray-500">Select primary files</div>
                </div>
                <div>
                  <p className="text-sm text-gray-700 mb-1">2. Select files with context</p>
                  <div className="border rounded-md p-2 text-gray-500">Select primary files</div>
                </div>
                <div>
                  <p className="text-sm text-gray-700 mb-1">3. Select any files as reference</p>
                  <div className="border rounded-md p-2 text-gray-500">Select primary files</div>
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-700 mb-1">4. Add any additional context / reasoning for the conversation</p>
                <textarea
                  className="w-full border rounded-md p-2 text-sm text-gray-700 resize-none"
                  rows={4}
                  placeholder="Instructions on how you want the AI to respond for this survey, what are you looking for, specific dos and don\'ts, your step-by-step process (if needed), etc."
                ></textarea>
              </div>
              <div className="flex justify-end">
                <Button>Save</Button>
              </div>
            </div>
          )}
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
} 