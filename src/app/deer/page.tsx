// Copyright (c) 2025 Bytedance Ltd. and/or its affiliates
// SPDX-License-Identifier: MIT

"use client";

import { GithubOutlined } from "@ant-design/icons";
import dynamic from "next/dynamic";
import Link from "next/link";
import { Suspense } from "react";

import { Button } from "~/components/ui/button";

import { Logo } from "../../components/deer-flow/logo";
import { ThemeToggle } from "../../components/deer-flow/theme-toggle";
import { Tooltip } from "../../components/deer-flow/tooltip";
import AnalyzeHeader from "../analyze/[pollid]/AnalyzeHeader";

const Main = dynamic(() => import("./main"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center">
      Loading DeerFlow...
    </div>
  ),
});

export default function HomePage() {
  return (
    <div className="flex flex-col h-screen w-screen overscroll-none">
      <header className="fixed top-0 left-0 flex h-12 w-full items-center justify-between px-4">
        <div className="flex items-center">
  
          <Suspense>
          </Suspense>
        </div>
      </header>
      
      <AnalyzeHeader id={"deerflow"} title={"DeerFlow"} />

      <div className="flex-1">
        <Main />
      </div>
    </div>
  );
}