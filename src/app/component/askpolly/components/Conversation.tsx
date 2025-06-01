"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useAppDispatch, useAppSelector } from "@/lib/store";
import ReactMarkdown from "react-markdown";
import { useParams } from "next/navigation";
import {
  addMessage,
  addReportItem,
  editConversation,
  selectConversation,
  updateConversationPollId,
} from "@/lib/features/askPolly/askPollySlice";
import {
  Message,
  createBookmark,
  generateResponse,
  regenerateResponse,
  storeConversation,
  StoreConversationRequest,
  generateTitle,
} from "@/app/api/ask polly/polly";
import { WebSocketService } from "./Websockets";
import ChatLoader from "@/components/ChatLoader";

interface ConversationProps {
  toggleReport: () => void;
  isReportVisible: boolean;
}

const Conversation: React.FC<ConversationProps> = ({
  toggleReport,
  isReportVisible,
}) => {
  const dispatch = useAppDispatch();
  const { pollid } = useParams();
  const pollId = Array.isArray(pollid) ? pollid[0] : pollid;
  const {
    conversations,
    selectedConversation: selectedConversationId,
    isLoading,
    currentPollId,
  } = useAppSelector((state) => state.askPolly);
  const [wsConnected, setWsConnected] = useState(false);
  const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null);
  const wsRef = useRef<WebSocketService | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [messageSendingLoading, setMessageSendingLoading] = useState(false);
  const isStoring = useRef(false);

  const selectedConversation = conversations.find(
    (convo: any) => convo.conversation_id === selectedConversationId
  );

  const handleWebSocketMessage = useCallback(
    async (data: any) => {
      try {
        if (data.type === "response") {
          const activeConversationId = selectedConversationId;
          if (!activeConversationId) {
            console.warn("No active conversation available");
            return;
          }

          const currentConversation = conversations.find(
            (convo) => convo.conversation_id === activeConversationId
          );

          if (!currentConversation) {
            console.error(
              "Active conversation not found:",
              activeConversationId
            );
            return;
          }

          // Format the assistant message
          const assistantMessage: Message = {
            role: "assistant",
            content: data.content,
            timestamp: data.timestamp || new Date().toISOString(),
            insights: data.insights,
            metadata: data.metadata,
          };

          // Generate title if it doesn't exist
          if (!currentConversation.conversation_title) {
            try {
              const lastUserMessage = currentConversation.messages
                .slice()
                .reverse()
                .find((msg) => msg.role === "user");

              if (lastUserMessage) {
                const title = await generateTitle(lastUserMessage.content);

                dispatch(
                  editConversation({
                    id: activeConversationId,
                    conversation_title: title,
                  })
                );

                // Update the conversation object with the new title
                currentConversation.conversation_title = title;
              }
            } catch (error) {
              console.error("Error generating title:", error);
            }
          }

          // Add message to redux store
          dispatch(
            addMessage({
              conversationId: activeConversationId,
              message: assistantMessage,
              shouldStore: true,
            })
          );

          // Store updated conversation
          const storeRequest: StoreConversationRequest = {
            conversation_id: activeConversationId,
            conversation_title: currentConversation.conversation_title,
            messages: [...currentConversation.messages, assistantMessage],
            poll_id: pollId || currentPollId || "",
          };

          setMessageSendingLoading(false);
          await storeConversation(storeRequest);

          if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop =
              chatContainerRef.current.scrollHeight;
          }
        }
      } catch (error) {
        console.error("Error processing WebSocket message:", error);
        setMessageSendingLoading(false);
      }
    },
    [selectedConversationId, conversations, dispatch, pollId, currentPollId]
  );

    // Function to scroll to bottom safely
const scrollToBottom = () => {
  if (chatContainerRef.current) {
    chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
  }
};

  const initializeWebSocket = useCallback(async () => {
    const apiSecret = process.env.NEXT_PUBLIC_APISECRET;
    const userEmail = localStorage.getItem("email");

    if (!apiSecret || !userEmail || !selectedConversationId) {
      return;
    }

    if (wsRef.current || wsConnected) {
      // console.log("WebSocket already initialized");
      return;
    }

    try {
      // Find the current conversation and its last user message
      const currentConversation = conversations.find(
        (convo) => convo.conversation_id === selectedConversationId
      );

      if (!currentConversation) {
        throw new Error("Conversation not found");
      }

      // Get or generate the title
      let initialTitle = currentConversation.conversation_title;

      const defaultTitleRegex = /^(new conversation|new chat(?: \d+)?)$/i;
      if (
        defaultTitleRegex.test(initialTitle) ||
        !initialTitle ||
        initialTitle === "New Chat"
      ) {
        // Find the last user message
        const lastUserMessage = currentConversation.messages
          .filter((msg) => msg.role === "user")
          .pop();

        if (lastUserMessage) {
          try {
            // console.log(
            //   "Generating title from last message:",
            //   lastUserMessage.content
            // );

            initialTitle = await generateTitle(lastUserMessage.content);

            // Update conversation title in Redux
            dispatch(
              editConversation({
                id: selectedConversationId,
                conversation_title: initialTitle,
              })
            );
          } catch (error) {
            console.error("Error generating title:", error);
          }
        } else {
          // console.log(
          //   "No user message found, generating title from conversation title"
          // );
          initialTitle = "New Conversation";
        }
      }

      // console.log("Creating new WebSocket connection...", {
      //   hasTitle: !!initialTitle,
      //   title: initialTitle,
      // });

      const ws = new WebSocketService(
        userEmail,
        apiSecret,
        handleWebSocketMessage,
        initialTitle
      );
      wsRef.current = ws;
      ws.connect();
      setWsConnected(true);
    } catch (error) {
      console.error("WebSocket initialization failed:", error);
      setWsConnected(false);
    }
  }, [
    selectedConversationId,
    wsConnected,
    handleWebSocketMessage,
    conversations,
    dispatch,
  ]);

  useEffect(() => {
    // Auto-select first conversation if none selected
    if (conversations.length > 0 && !selectedConversationId) {
      // console.log("Auto-selecting first conversation");
      dispatch(selectConversation(conversations[0].conversation_id));
    }
  }, [conversations, selectedConversationId, dispatch]);

  // Separate effect for WebSocket initialization
  useEffect(() => {
    if (selectedConversationId && !wsConnected) {
      // console.log("Selected conversation changed, initializing WebSocket");
      initializeWebSocket();
    }
  }, [selectedConversationId, wsConnected, initializeWebSocket]);

  useEffect(() => {
    // Initialize WebSocket when we have both a selectedConversationId and pollId
    if (selectedConversationId && (pollId || currentPollId) && !wsConnected) {
      // console.log("Initializing WebSocket with:", {
      //   conversationId: selectedConversationId,
      //   pollId: pollId || currentPollId,
      //   converation_title: selectedConversation?.conversation_title,
      // });
      initializeWebSocket();
    }
  }, [
    selectedConversationId,
    pollId,
    currentPollId,
    wsConnected,
    initializeWebSocket,
  ]);

  // const resetInactivityTimer = useCallback(() => {
  //   if (inactivityTimerRef.current) {
  //     clearTimeout(inactivityTimerRef.current);
  //   }

  //   inactivityTimerRef.current = setTimeout(() => {
  //     if (wsRef.current) {
  //       console.log("Disconnecting due to inactivity");
  //       // wsRef.current.disconnect();
  //       wsRef.current = null;
  //       setWsConnected(false);
  //     }
  //   }, 5 * 60 * 1000); // 5 minutes
  // }, []);

  useEffect(() => {
    return () => {
      if (wsRef.current) {
        // wsRef.current.disconnect();
        wsRef.current = null;
        setWsConnected(false);
      }
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
      }
    };
  }, [selectedConversationId]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || isStoring.current) return;

    const activePollId = pollId || currentPollId;
    if (!activePollId) {
      alert(
        "Unable to send message: Conversation must be associated with a poll"
      );
      return;
    }

    if (!selectedConversationId) {
      alert("No active conversation available");
      return;
    }

    setMessageSendingLoading(true);
    const messageContent = newMessage;
    setNewMessage("");

    try {
      // Create the user message
      const userMessage: Message = {
        role: "user",
        content: messageContent,
        timestamp: new Date().toISOString(),
      };

      // Find current conversation
      const currentConversation = conversations.find(
        (convo) => convo.conversation_id === selectedConversationId
      );

      if (!currentConversation) {
        throw new Error("Conversation not found");
      }

      // Add message to redux store first
      dispatch(
        addMessage({
          conversationId: selectedConversationId,
          message: userMessage,
          shouldStore: true,
        })
      );

      // Generate title if this is the first message
      let conversationTitle = currentConversation.conversation_title;
      const defaultTitleRegex = /^(new conversation|new chat(?: \d+)?)$/i;

      if (
        !conversationTitle ||
        defaultTitleRegex.test(conversationTitle) ||
        currentConversation.messages.length === 0
      ) {
        try {
          // console.log("Generating title for first message:", messageContent);
          const title = await generateTitle(messageContent);
          // console.log("Generated title:", title);

          // Update conversation title in Redux
          dispatch(
            editConversation({
              id: selectedConversationId,
              conversation_title: title,
            })
          );

          // Update WebSocket title
          if (wsRef.current) {
            wsRef.current.updateTitle(title);
          }

          conversationTitle = title;
        } catch (error) {
          console.error("Error generating title:", error);
          conversationTitle = "New Chat";
        }
      }

      // Store the updated conversation
      const storeRequest: StoreConversationRequest = {
        conversation_id: selectedConversationId,
        conversation_title: conversationTitle,
        messages: [...currentConversation.messages, userMessage],
        poll_id: activePollId,
      };

      await storeConversation(storeRequest);
      scrollToBottom()

      // Send message through WebSocket
      if (wsRef.current) {
        wsRef.current.sendMessage({
          content: messageContent,
          conversation_id: selectedConversationId,
          poll_id: activePollId,
          conversation_title: conversationTitle,
        });
      }
    } catch (error) {
      console.error("Error in conversation:", error);
      alert("Failed to process message. Please try again.");
      setMessageSendingLoading(false);
    }
  };

  const handleRegenerateResponse = async () => {
    if (!selectedConversation || !selectedConversationId || isStoring.current)
      return;

    // Ensure we have a poll ID
    const activePollId = pollId || currentPollId;
    if (!activePollId) {
      console.error("No poll ID available");
      alert("Unable to regenerate response: No poll ID available");
      return;
    }

    const lastUserMessage = selectedConversation.messages
      .slice()
      .reverse()
      .find((msg) => msg.role === "user");

    if (!lastUserMessage) return;

    try {
      isStoring.current = true;
      const response = await regenerateResponse(
        lastUserMessage.content,
        selectedConversation.messages
      );

      const newMessage: Message = {
        role: "assistant",
        content: response.response,
        timestamp: new Date().toISOString(),
      };

      dispatch(
        addMessage({
          conversationId: selectedConversationId,
          message: newMessage,
          shouldStore: true, // Optional, but explicitly set when needed
        })
      );

      // Store the updated conversation
      const updatedConversation = conversations.find(
        (convo) => convo.conversation_id === selectedConversationId
      );

      if (updatedConversation) {
        // Get the existing conversation title or generate a new one
        let conversationTitle = updatedConversation.conversation_title;
        if (!conversationTitle) {
          conversationTitle = await generateTitle(lastUserMessage.content);
          dispatch(
            editConversation({
              id: selectedConversationId,
              conversation_title: conversationTitle,
            })
          );
        }

        const storeRequest: StoreConversationRequest = {
          conversation_id: selectedConversationId,
          conversation_title: conversationTitle,
          messages: [...updatedConversation.messages, newMessage],
          poll_id: activePollId, // Always use the active poll ID
        };

        await storeConversation(storeRequest);
      }
    } catch (error) {
      console.error("Error regenerating response:", error);
    } finally {
      isStoring.current = false;
    }
  };

  const handleCopyMessage = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (error) {
      console.error("Failed to copy text:", error);
    }
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage();
    }
  };

  const handleAddToReport = async (e: React.MouseEvent, text: string) => {
    // Stop event propagation
    e.preventDefault();
    e.stopPropagation();

    const activePollId = pollId || currentPollId;
    if (!activePollId) {
      console.error("No poll ID available");
      alert("Unable to bookmark: No poll ID available");
      return;
    }

    try {
      // Get the most recent user query
      const userQuery =
        selectedConversation?.messages
          .filter((msg) => msg.role === "user")
          .slice(-1)[0]?.content || "";

      // Create bookmark
      await createBookmark({
        title: userQuery.slice(0, 100), // Limit title length
        user_query: userQuery,
        base_response: text,
        poll_id: activePollId,
      });

      // Add to report store
      dispatch(
        addReportItem({
          text,
          user_query: userQuery,
        })
      );
    } catch (error: any) {
      console.error("Error creating bookmark:", error);

      // More specific error messaging
      if (error.response?.status === 500) {
        console.error("Server error creating bookmark:", error.response);
        alert("Server error creating bookmark. Please try again.");
      } else if (error.message === "Missing required fields for bookmark") {
        alert("Please ensure all required fields are provided.");
      } else {
        alert(error.response?.data?.detail || "Failed to create bookmark");
      }
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <img src="/loaders/loader-blue.gif" alt="Send" className="w-16 h-16" />
      </div>
    );
  }

  const parseTitle = (title: any) => {
    try {
      // If title is undefined or null, return default
      if (!title) return "New Conversation";

      // First try to parse as JSON if it looks like JSON
      let processedTitle = title;
      if (
        typeof title === "string" &&
        (title.startsWith('"') || title.startsWith("{"))
      ) {
        try {
          processedTitle = JSON.parse(title);
        } catch {
          processedTitle = title;
        }
      }

      // Remove any markdown formatting (**, __, etc)
      return processedTitle
        .replace(/\*\*/g, "") // Remove bold markers
        .replace(/__/g, "") // Remove underscore emphasis
        .replace(/\\/g, "") // Remove escape characters
        .trim(); // Remove extra whitespace
    } catch (e) {
      // Fallback for any errors
      return title?.toString() || "New Conversation";
    }
  };




  return (
    <div className="relative flex flex-col h-full bg-white p-4 shadow rounded-md">
      {/* Conversation Header */}
      <div className="items-center pb-2 mb-2">
        <div>
          <div className="flex items-center justify-between gap-2 mb-2">
            <h2 className="text-gray-400 truncate w-[50%]">
              {parseTitle(selectedConversation?.conversation_title)}
            </h2>
            <button
              onClick={toggleReport}
              className="ml-2 p-2 rounded-full hover:bg-gray-100 focus:outline-none transition-colors"
            >
              <img
                src="/images/askPolly/slideBtn.svg"
                alt="Toggle"
                className="w-6 h-6"
              />
            </button>
          </div>
          <p className="text-xs text-center text-gray-400">
            {selectedConversation?.messages.length
              ? new Date(
                  selectedConversation.messages[
                    selectedConversation.messages.length - 1
                  ].timestamp
                ).toLocaleString()
              : "Start a new conversation"}
          </p>
        </div>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-hidden relative">
        <div
          ref={chatContainerRef}
          className="absolute inset-0 flex flex-col p-4 gap-4 overflow-y-auto custom-scrollbar"
        >
          {selectedConversation ? (
            selectedConversation.messages.map((message, index) => (
              <div
                key={`${message.role}-${index}-${message.timestamp}`}
                className={`${
                  message.role === "user"
                    ? "bg-gradient-to-b from-[#5E53DC] to-[#5083E2] self-end text-primaryWhite"
                    : "bg-gray-100"
                } px-6 py-3 rounded-2xl max-w-lg break-words shadow-sm relative ${
                  index === selectedConversation.messages.length - 1 &&
                  message.role === "assistant"
                    ? "mb-7"
                    : "mb-0"
                }`}
              >
                {message.role === "assistant" ? (
                  <div>
                    <ReactMarkdown className="text-[16px] text-inherit">
                      {message.content}
                    </ReactMarkdown>
                    {message.insights && (
                      <div className="text-[16px] text-inherit">
                        <ReactMarkdown>
                          {message.insights.insights}
                        </ReactMarkdown>
                        {/* {message.insights.metrics && (
          <div className="mt-1">
            <strong>Metrics:</strong>
            <ul>
              {Object.entries(message.insights.metrics).map(([key, value]) => (
                <li key={key}>{key}: {value}/10</li>
              ))}
            </ul>
          </div>
        )} */}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-[16px] text-inherit whitespace-pre-wrap">
                    {message.content}
                  </div>
                )}

                {/* Actions buttons for assistant messages */}
                {index === selectedConversation.messages.length - 1 &&
                  message.role === "assistant" && (
                    <div className="absolute top-full left-4 flex gap-2 items-center mt-3 text-xs">
                      <button
                        className="cursor-pointer active:scale-90 rounded-full py-1 px-2 bg-[#DBEAFF] flex items-center justify-center gap-2 hover:bg-[#C5DDFF] transition-colors"
                        onClick={handleRegenerateResponse}
                        disabled={isStoring.current}
                      >
                        <img
                          src="/images/askPolly/refreshBtn.svg"
                          alt="Refresh"
                          className="w-4 h-4"
                        />
                        <span className="text-xs">Redo</span>
                      </button>
                      <button
                        className="cursor-pointer active:scale-90 rounded-full py-1 px-2 bg-[#DBEAFF] flex items-center justify-center gap-2 hover:bg-[#C5DDFF] transition-colors"
                        onClick={() => handleCopyMessage(message.content)}
                      >
                        <img
                          src="/images/askPolly/copy.svg"
                          alt="Copy"
                          className="w-4 h-4"
                        />
                        <span className="text-xs">Copy</span>
                      </button>
                      <button
                        className="cursor-pointer active:scale-90 rounded-full py-1 px-2 bg-[#DBEAFF] flex items-center justify-center gap-2 hover:bg-[#C5DDFF] transition-colors"
                        onClick={(e) => handleAddToReport(e, message.content)}
                      >
                        <img
                          src="/images/askPolly/bookmark.svg"
                          alt="Bookmark"
                          className="w-4 h-4"
                        />
                        <span className="text-xs">Bookmark</span>
                      </button>
                    </div>
                  )}
              </div>
              
            ))
          ) : (
            <p className="text-gray-500 self-center">
              Select a conversation or start a new one.
            </p>
          )}
          {
            messageSendingLoading && (
              <ChatLoader /> 
            )
          }
        </div>
      </div>

      {/* Message Input */}
      <div className="flex items-center border-t pt-4 mt-4">
        <div
          className={`w-full border border-gray-300 rounded-md flex ${
            isFocused ? "ring-1 ring-blue-600" : ""
          } hover:border-gray-400 transition-colors`}
        >
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder={
              messageSendingLoading
                ? "Ask me something..."
                : "Ask me something..."
            }
            className="flex-1 p-2 bg-transparent border-none outline-none placeholder:text-gray-400"
            onKeyDown={handleKeyPress}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            disabled={isLoading || isStoring.current || messageSendingLoading}
          />
          {messageSendingLoading ? (
            <div className="ml-2 p-2">
              <img
                src="/loaders/loader-blue.gif"
                alt="Send"
                className="w-6 h-6"
              />
            </div>
          ) : (
            <button
              onClick={handleSendMessage}
              disabled={isLoading || !newMessage.trim() || isStoring.current}
              className={`ml-2 p-2 text-white hover:bg-gray-100 rounded-full focus:outline-none transition-colors
                ${!newMessage.trim() || isLoading || isStoring.current ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
            >
              <img
                src="/images/askPolly/sendBtn.svg"
                alt="Send"
                className="w-6 h-6"
              />
            </button>
          )}
        </div>
      </div>

      <p className="text-gray-400 text-xs text-center mt-2">
        Polly is in beta. Please review and verify answers before using it
        professionally.
      </p>
    </div>
  );
};
export default Conversation;