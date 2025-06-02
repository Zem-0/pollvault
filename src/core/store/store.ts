// Copyright (c) 2025 Bytedance Ltd. and/or its affiliates
// SPDX-License-Identifier: MIT

import { nanoid } from "nanoid";
import { toast } from "sonner";
import { create } from "zustand";
import { useShallow } from "zustand/react/shallow";

import { chatStream, generatePodcast } from "../api";
import type { Message } from "../messages";
import { mergeMessage } from "../messages";
import { parseJSON } from "../utils";

import { getChatStreamSettings } from "./settings-store";

const THREAD_ID = nanoid();

export interface Research {
  id: string;
  messages: Message[];
}

interface Store {
  messages: Message[];
  research: Research | null;
  isResponding: boolean;
  responding: boolean;
  threadId: string | undefined;
  messageIds: string[];
  researchIds: string[];
  researchPlanIds: Map<string, string>;
  researchReportIds: Map<string, string>;
  researchActivityIds: Map<string, string[]>;
  ongoingResearchId: string | null;
  openResearchId: string | null;
  
  // Actions
  addMessage: (message: Message) => void;
  updateMessage: (message: Message) => void;
  setResearch: (research: Research | null) => void;
  setResponding: (isResponding: boolean) => void;
  openResearch: (researchId: string | null) => void;
  closeResearch: () => void;
  setOngoingResearch: (researchId: string | null) => void;
}

export const useStore = create<Store>((set) => ({
  messages: [],
  research: null,
  isResponding: false,
  responding: false,
  threadId: THREAD_ID,
  messageIds: [],
  researchIds: [],
  researchPlanIds: new Map(),
  researchReportIds: new Map(),
  researchActivityIds: new Map(),
  ongoingResearchId: null,
  openResearchId: null,

  addMessage: (message) => 
    set((state) => ({
      messages: [...state.messages, message],
      messageIds: [...state.messageIds, message.id]
    })),

  updateMessage: (message) =>
    set((state) => ({
      messages: state.messages.map((m) => 
        m.id === message.id ? message : m
      )
    })),

  setResearch: (research) =>
    set({ research }),

  setResponding: (isResponding) =>
    set({ isResponding }),

  openResearch: (researchId) =>
    set({ openResearchId: researchId }),

  closeResearch: () => {
    console.log("closeResearch called");
    set({ openResearchId: null, research: null });
  },

  setOngoingResearch: (researchId) =>
    set({ ongoingResearchId: researchId })
}));

// Move helper functions here
function getOngoingResearchId() {
  return useStore.getState().ongoingResearchId;
}

function appendResearch(researchId: string) {
  let planMessage: Message | undefined;
  const reversedMessageIds = [...useStore.getState().messageIds].reverse();
  for (const messageId of reversedMessageIds) {
    const message = getMessage(messageId);
    if (message?.agent === "planner") {
      planMessage = message;
      break;
    }
  }
  const messageIds = [researchId];
  messageIds.unshift(planMessage!.id);

  // Create and set the research object in the store
  const newResearch: Research = {
    id: researchId,
    messages: [planMessage!],
  };
  useStore.getState().setResearch(newResearch);

  useStore.setState({
    ongoingResearchId: researchId,
    researchIds: [...useStore.getState().researchIds, researchId],
    researchPlanIds: new Map(useStore.getState().researchPlanIds).set(
      researchId,
      planMessage!.id,
    ),
    researchActivityIds: new Map(useStore.getState().researchActivityIds).set(
      researchId,
      messageIds,
    ),
  });
  openResearch(researchId);
}

function appendResearchActivity(message: Message) {
  const researchId = getOngoingResearchId();
  if (researchId) {
    const researchActivityIds = useStore.getState().researchActivityIds;
    const current = researchActivityIds.get(researchId)!;
    if (!current.includes(message.id)) {
      useStore.setState({
        researchActivityIds: new Map(researchActivityIds).set(researchId, [
          ...current,
          message.id,
        ]),
      });
    }
    if (message.agent === "reporter") {
      useStore.setState({
        researchReportIds: new Map(useStore.getState().researchReportIds).set(
          researchId,
          message.id,
        ),
      });
    }
  }
}

function appendMessage(message: Message) {
  console.log("appendMessage called with message:", message);
  const ongoingResearchId = getOngoingResearchId();
  console.log("ongoingResearchId:", ongoingResearchId);

  // If it's a research-related message and research is ongoing, add it to the research messages
  if (
    ongoingResearchId &&
    (message.agent === "coder" ||
      message.agent === "reporter" ||
      message.agent === "researcher")
  ) {
    console.log("Adding message to research.messages:", message);
    useStore.setState((state) => ({
      research: state.research
        ? { // Ensure research object exists before appending
            ...state.research,
            messages: [...state.research.messages, message],
          }
        : null, // Should not happen if ongoingResearchId is set, but good practice
    }));
    appendResearchActivity(message); // Keep this for updating other research state
  } else if (
    !ongoingResearchId &&
    message.agent === "planner"
     // Assuming the first 'planner' message signals the start of research
  ) {
    console.log("Starting new research with planner message:", message);
    // This is the initial planner message, start new research
    const newResearchId = message.id;
    appendResearch(newResearchId); // This initializes the research object and sets ongoingResearchId
    // The appendResearch function already adds the planner message to research.messages
    appendResearchActivity(message); // Add initial planner message to research activity
  }

  // Always add message to the main chat messages list
  useStore.getState().addMessage(message);
}

function existsMessage(id: string) {
  return useStore.getState().messages.some((m) => m.id === id);
}

function getMessage(id: string) {
  return useStore.getState().messages.find((m) => m.id === id);
}

function findMessageByToolCallId(toolCallId: string) {
  return useStore.getState().messages.reverse().find((message) => {
    if (message.toolCalls) {
      return message.toolCalls.some((toolCall) => toolCall.id === toolCallId);
    }
    return false;
  });
}

export function useResearchMessage(researchId: string) {
  return useStore(
    useShallow((state) => {
      const messageId = state.research?.messages.find((m) => m.id === researchId)?.id;
      return messageId ? state.messages.find((m) => m.id === messageId) : undefined;
    }),
  );
}

export function useMessage(messageId: string | null | undefined) {
  return useStore(
    useShallow((state) =>
      messageId ? state.messages.find((m) => m.id === messageId) : undefined,
    ),
  );
}

export function useMessageIds() {
  return useStore(useShallow((state) => state.messages.map((m) => m.id)));
}

export function useLastInterruptMessage() {
  return useStore(
    useShallow((state) => {
      if (state.messages.length >= 2) {
        const lastMessage = state.messages[state.messages.length - 1];
        return lastMessage?.finishReason === "interrupt" ? lastMessage : null;
      }
      return null;
    }),
  );
}

export function useLastFeedbackMessageId() {
  const waitingForFeedbackMessageId = useStore(
    useShallow((state) => {
      if (state.messages.length >= 2) {
        const lastMessage = state.messages[state.messages.length - 1];
        if (lastMessage && lastMessage.finishReason === "interrupt") {
          return state.messages[state.messages.length - 2].id;
        }
      }
      return null;
    }),
  );
  return waitingForFeedbackMessageId;
}

export function useToolCalls() {
  return useStore(
    useShallow((state) => {
      return state.messages
        .filter((m) => m.toolCalls)
        .map((m) => m.toolCalls)
        .flat();
    }),
  );
}

export function openResearch(researchId: string | null) {
  useStore.getState().openResearch(researchId);
}

export function closeResearch() {
  useStore.getState().closeResearch();
}

export async function sendMessage(
  content?: string,
  {
    interruptFeedback,
  }: {
    interruptFeedback?: string;
  } = {},
  options: { abortSignal?: AbortSignal } = {},
) {
  if (content != null) {
    useStore.getState().addMessage({
      id: nanoid(),
      threadId: THREAD_ID,
      role: "user",
      content: content,
      contentChunks: [content],
    });
  }

  const settings = getChatStreamSettings();
  const stream = chatStream(
    content ?? "[REPLAY]",
    {
      thread_id: THREAD_ID,
      interrupt_feedback: interruptFeedback,
      auto_accepted_plan: settings.autoAcceptedPlan,
      enable_background_investigation:
        settings.enableBackgroundInvestigation ?? true,
      max_plan_iterations: settings.maxPlanIterations,
      max_step_num: settings.maxStepNum,
      max_search_results: settings.maxSearchResults,
      mcp_settings: settings.mcpSettings,
    },
    options,
  );

  useStore.getState().setResponding(true);
  let messageId: string | undefined;
  try {
    for await (const event of stream) {
      const { type, data } = event;
      messageId = data.id;
      let message: Message | undefined;
      if (type === "tool_call_result") {
        message = findMessageByToolCallId(data.tool_call_id);
      } else if (!existsMessage(messageId)) {
        message = {
          id: messageId,
          threadId: data.thread_id,
          agent: data.agent,
          role: data.role,
          content: "",
          contentChunks: [],
          isStreaming: true,
          interruptFeedback,
        };
        useStore.getState().addMessage(message);
      }
      message ??= getMessage(messageId);
      if (message) {
        message = mergeMessage(message, event);
        useStore.getState().updateMessage(message);
      }
    }
  } catch {
    toast("An error occurred while generating the response. Please try again.");
    // Update message status.
    // TODO: const isAborted = (error as Error).name === "AbortError";
    if (messageId != null) {
      const message = getMessage(messageId);
      if (message?.isStreaming) {
        message.isStreaming = false;
        useStore.getState().updateMessage(message);
      }
    }
    useStore.getState().setResearch(null);
  } finally {
    useStore.getState().setResponding(false);
  }
}
